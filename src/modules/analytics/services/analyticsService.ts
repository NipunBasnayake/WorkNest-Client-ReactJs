import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getId, getNumber, getString, toIsoDate } from "@/services/http/parsers";
import { PERMISSIONS } from "@/constants/permissions";
import { getRolePermissions, normalizeAppRole } from "@/constants/rolePermissionMap";
import { useAuthStore } from "@/store/authStore";
import { getEmployees } from "@/modules/employees/services/employeeService";
import { getTeams } from "@/modules/teams/services/teamService";
import { getProjects } from "@/modules/projects/services/projectService";
import {
  filterTasksForViewer,
  getTasks,
  hasTaskViewerIdentity,
  resolveTaskViewerIdentity,
} from "@/modules/tasks/services/taskService";
import { getLeaveRequests } from "@/modules/leave/services/leaveService";
import { getAllAttendanceRecords, getAttendanceSummary } from "@/modules/attendance/services/attendanceService";
import { getAnnouncements } from "@/modules/announcements/services/announcementService";
import { getNotifications } from "@/modules/notifications/services/notificationService";
import type {
  DashboardAttendanceSummary,
  DashboardLeaveStatusSummary,
  DashboardTaskStatusSummary,
  DistributionDatum,
  ProgressDatum,
  TenantAnalyticsData,
  TenantDashboardSnapshot,
  BusinessIntelligenceData,
} from "@/modules/analytics/types";
import type { ApiResponse } from "@/types";
import type { AttendanceRecord } from "@/modules/attendance/types";
import type { LeaveRequest } from "@/modules/leave/types";
import type { Task } from "@/modules/tasks/types";

import type { AnalyticsFilters, BusinessInsight } from '@/modules/analytics/types';
import type { RecruitmentDashboardSummary, RecruitmentInterviewMode, RecruitmentStage } from '@/modules/recruitment/types';
import { tenantRoutes } from '@/utils/tenantRoutes';

const STATUS_COLORS: Record<string, string> = {
  TODO: "#6366f1",
  IN_PROGRESS: "#9332EA",
  IN_REVIEW: "#d97706",
  BLOCKED: "#ef4444",
  DONE: "#10b981",
  PENDING: "#d97706",
  APPROVED: "#10b981",
  REJECTED: "#ef4444",
  CANCELLED: "#64748b",
  ACTIVE: "#10b981",
  INACTIVE: "#64748b",
  SUSPENDED: "#ef4444",
  TENANT_ADMIN: "#9332EA",
  HR: "#d97706",
  EMPLOYEE: "#10b981",
};

function labelize(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toDistribution(data: Record<string, number>): DistributionDatum[] {
  return Object.entries(data)
    .map(([key, value]) => ({
      label: labelize(key),
      value,
      color: STATUS_COLORS[key.toUpperCase()] ?? "#9332EA",
    }))
    .sort((a, b) => b.value - a.value);
}

function toDistributionFromUnknown(input: unknown): DistributionDatum[] {
  if (Array.isArray(input)) {
    const countMap = input.reduce<Record<string, number>>((acc, item) => {
      const value = asRecord(item);
      const label = firstDefined(
        getString(value.label),
        getString(value.name),
        getString(value.key),
        getString(value.status),
        getString(value.role),
        getString(value.designation)
      ) ?? "Unknown";
      const count = firstDefined(
        getNumber(value.value),
        getNumber(value.count),
        getNumber(value.total)
      ) ?? 0;
      acc[label.toUpperCase()] = count;
      return acc;
    }, {});
    return toDistribution(countMap);
  }

  const mapInput = asRecord(input);
  const countMap = Object.entries(mapInput).reduce<Record<string, number>>((acc, [key, value]) => {
    const count = getNumber(value);
    if (count !== undefined) acc[key.toUpperCase()] = count;
    return acc;
  }, {});
  return toDistribution(countMap);
}

function toProgressFromUnknown(input: unknown): ProgressDatum[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        const value = asRecord(item);
        const assignee = asRecord(value.assignee);
        const label = firstDefined(
          getString(assignee.name),
          getString(assignee.fullName),
          getString(value.label),
          getString(value.name),
          getString(value.projectName),
          getString(value.employeeName),
          getString(value.assigneeName)
        ) ?? "Unknown";
        const count = firstDefined(
          getNumber(value.value),
          getNumber(value.count),
          getNumber(value.progress),
          getNumber(value.percentage)
        ) ?? 0;
        return { label, value: count };
      })
      .filter((item) => item.label);
  }

  const mapInput = asRecord(input);
  return Object.entries(mapInput).map(([label, value]) => ({
    label,
    value: getNumber(value) ?? 0,
  }));
}

function roleDashboardEndpoint(): string {
  const currentRole = normalizeAppRole(useAuthStore.getState().user?.role);
  if (currentRole === 'MANAGER') return '/api/tenant/dashboard/manager';
  const role = normalizeAppRole(useAuthStore.getState().user?.role);
  if (role === "TENANT_ADMIN") return "/api/tenant/dashboard/tenant-admin";
  if (role === "HR") return "/api/tenant/dashboard/hr";
  return "/api/tenant/dashboard/me";
}

async function fetchDashboardRaw(): Promise<unknown> {
  const role = normalizeAppRole(useAuthStore.getState().user?.role);
  const primaryEndpoint = roleDashboardEndpoint();
  const fallbackEndpoints =
    role === "TENANT_ADMIN"
      ? ["/api/tenant/dashboard/hr", "/api/tenant/dashboard/me"]
      : role === "HR"
        ? ["/api/tenant/dashboard/me"]
        : [];

  const endpoints = [primaryEndpoint, ...fallbackEndpoints].filter(
    (endpoint, index, list) => list.indexOf(endpoint) === index
  );

  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(endpoint);
      return unwrapApiData<unknown>(data);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Unable to fetch tenant dashboard data.");
}

async function fetchTenantAnalyticsPayload(
  endpoint: string,
  params?: Record<string, string>
): Promise<unknown> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(endpoint, { params });
  return unwrapApiData<unknown>(data);
}

function mapStatusCounts(input: unknown): Record<string, number> {
  return extractList(input).reduce<Record<string, number>>((acc, item) => {
    const value = asRecord(item);
    const status = firstDefined(getString(value.status), getString(value.label), getString(value.key))?.toUpperCase();
    const count = firstDefined(getNumber(value.count), getNumber(value.value), getNumber(value.total)) ?? 0;
    if (!status) return acc;
    acc[status] = count;
    return acc;
  }, {});
}

const DAY_MS = 24 * 60 * 60 * 1000;

function emptyTaskStatusSummary(): DashboardTaskStatusSummary {
  return {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    BLOCKED: 0,
    DONE: 0,
  };
}

function emptyLeaveStatusSummary(): DashboardLeaveStatusSummary {
  return {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    CANCELLED: 0,
  };
}

function emptyAttendanceSummary(): DashboardAttendanceSummary {
  return {
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    halfDay: 0,
    incomplete: 0,
    myTodayStatus: "NOT_MARKED",
    myWorkedMinutes: 0,
  };
}

function createEmptyTenantDashboardSnapshot(): TenantDashboardSnapshot {
  return {
    totalEmployees: 0,
    activeTeams: 0,
    activeProjects: 0,
    completedTasks: 0,
    openTasks: 0,
    pendingLeaves: 0,
    presentToday: 0,
    unreadNotifications: 0,
    taskStatusSummary: emptyTaskStatusSummary(),
    leaveStatusSummary: emptyLeaveStatusSummary(),
    attendanceSummary: emptyAttendanceSummary(),
    dueSoonTasks: [],
    recentTasks: [],
    recentLeaves: [],
    pendingApprovals: [],
    announcements: [],
    notifications: [],
  };
}

function normalizeRole(role: unknown): string {
  return normalizeAppRole(getString(role)) ?? "";
}

function isEmployeeRole(role: string): boolean {
  return role === "EMPLOYEE";
}

function isManagementRole(role: string): boolean {
  return getRolePermissions(role).includes(PERMISSIONS.ANALYTICS_VIEW);
}

function toTimestamp(value: string | undefined): number {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function summarizeAttendance(records: AttendanceRecord[]): DashboardAttendanceSummary {
  return records.reduce<DashboardAttendanceSummary>((acc, record) => {
    acc.total += 1;
    if (record.status === "PRESENT") acc.present += 1;
    if (record.status === "ABSENT") acc.absent += 1;
    if (record.status === "HALF_DAY") acc.halfDay += 1;
    if (record.status === "INCOMPLETE") acc.incomplete += 1;
    if (record.late || record.status === "LATE") acc.late += 1;
    return acc;
  }, emptyAttendanceSummary());
}

function toTaskStatusSummary(tasks: Task[], dashboardStatusMap: Record<string, number>): DashboardTaskStatusSummary {
  const computed = tasks.reduce<DashboardTaskStatusSummary>((acc, task) => {
    if (task.status === "TODO") acc.TODO += 1;
    if (task.status === "IN_PROGRESS") acc.IN_PROGRESS += 1;
    if (task.status === "IN_REVIEW") acc.IN_REVIEW += 1;
    if (task.status === "BLOCKED") acc.BLOCKED += 1;
    if (task.status === "DONE") acc.DONE += 1;
    return acc;
  }, emptyTaskStatusSummary());

  return {
    TODO: firstDefined(dashboardStatusMap.TODO, dashboardStatusMap.BACKLOG, computed.TODO) ?? 0,
    IN_PROGRESS: firstDefined(dashboardStatusMap.IN_PROGRESS, computed.IN_PROGRESS) ?? 0,
    IN_REVIEW: firstDefined(dashboardStatusMap.IN_REVIEW, dashboardStatusMap.REVIEW, computed.IN_REVIEW) ?? 0,
    BLOCKED: firstDefined(dashboardStatusMap.BLOCKED, computed.BLOCKED) ?? 0,
    DONE: firstDefined(dashboardStatusMap.DONE, dashboardStatusMap.COMPLETED, computed.DONE) ?? 0,
  };
}

function toLeaveStatusSummary(leaves: LeaveRequest[], dashboardStatusMap: Record<string, number>): DashboardLeaveStatusSummary {
  const computed = leaves.reduce<DashboardLeaveStatusSummary>((acc, leave) => {
    if (leave.status === "PENDING") acc.PENDING += 1;
    if (leave.status === "APPROVED") acc.APPROVED += 1;
    if (leave.status === "REJECTED") acc.REJECTED += 1;
    if (leave.status === "CANCELLED") acc.CANCELLED += 1;
    return acc;
  }, emptyLeaveStatusSummary());

  return {
    PENDING: firstDefined(dashboardStatusMap.PENDING, computed.PENDING) ?? 0,
    APPROVED: firstDefined(dashboardStatusMap.APPROVED, computed.APPROVED) ?? 0,
    REJECTED: firstDefined(dashboardStatusMap.REJECTED, computed.REJECTED) ?? 0,
    CANCELLED: firstDefined(dashboardStatusMap.CANCELLED, computed.CANCELLED) ?? 0,
  };
}

function normalizeRecruitmentStage(value: unknown): RecruitmentStage {
  const status = (getString(value) ?? "APPLIED").toUpperCase();
  if (status === "SCREENING") return "SHORTLISTED";
  if (status === "TECHNICAL" || status === "HR_REVIEW") return "INTERVIEW";
  if (status === "WITHDRAWN") return "REJECTED";
  return status as RecruitmentStage;
}

function normalizeRecruitmentSummary(value: unknown): RecruitmentDashboardSummary | undefined {
  const record = asRecord(value);
  if (Object.keys(record).length === 0) return undefined;

  return {
    openJobs: getNumber(record.openJobs) ?? 0,
    applicationsReceived: getNumber(record.applicationsReceived) ?? 0,
    shortlisted: getNumber(record.shortlisted) ?? 0,
    interviewsScheduled: getNumber(record.interviewsScheduled) ?? 0,
    offers: getNumber(record.offers) ?? 0,
    hired: getNumber(record.hired) ?? 0,
    recentApplications: extractList(record.recentApplications).map((item) => {
      const application = asRecord(item);
      return {
        id: getId(application.id),
        candidateName: getString(application.candidateName) ?? "Unknown candidate",
        jobTitle: getString(application.jobTitle) ?? "Untitled job",
        status: normalizeRecruitmentStage(application.status),
        appliedAt: getString(application.appliedAt),
      };
    }).filter((item) => Boolean(item.id)),
    upcomingInterviews: extractList(record.upcomingInterviews).map((item) => {
      const interview = asRecord(item);
      return {
        id: getId(interview.id),
        applicationId: getId(interview.applicationId),
        candidateName: getString(interview.candidateName) ?? "Unknown candidate",
        jobTitle: getString(interview.jobTitle) ?? "Untitled job",
        mode: (getString(interview.mode)?.toUpperCase() ?? "REMOTE") as RecruitmentInterviewMode,
        scheduledAt: getString(interview.scheduledAt) ?? "",
      };
    }).filter((item) => Boolean(item.id && item.applicationId)),
  };
}

export async function getTenantDashboardSnapshot(): Promise<TenantDashboardSnapshot> {
  try {
    const raw = asRecord(await fetchDashboardRaw());
    const role = normalizeRole(useAuthStore.getState().user?.role);
    const isEmployee = isEmployeeRole(role);
    const canAccessManagementData = isManagementRole(role);
    const todayIso = new Date().toISOString().slice(0, 10);

    const employeesPromise: Promise<Awaited<ReturnType<typeof getEmployees>>> = canAccessManagementData
      ? getEmployees().catch(() => [])
      : Promise.resolve([]);
    const teamsPromise: Promise<Awaited<ReturnType<typeof getTeams>>> = canAccessManagementData
      ? getTeams().catch(() => [])
      : Promise.resolve([]);
    const projectsPromise: Promise<Awaited<ReturnType<typeof getProjects>>> = canAccessManagementData
      ? getProjects().catch(() => [])
      : Promise.resolve([]);
    const attendanceSummaryPromise: Promise<Awaited<ReturnType<typeof getAttendanceSummary>> | null> = canAccessManagementData
      ? getAttendanceSummary().catch(() => null)
      : Promise.resolve(null);
    const myAttendancePromise: Promise<AttendanceRecord[]> = isEmployee
      ? getAllAttendanceRecords().catch(() => [])
      : Promise.resolve([]);
    const taskViewerIdentityPromise = isEmployee
      ? resolveTaskViewerIdentity().catch(() => null)
      : Promise.resolve(null);

    const [tasks, leaves, announcements, notifications, employees, teams, projects, dailyAttendanceSummary, myAttendanceRecords, taskViewerIdentity] = await Promise.all([
      getTasks().catch(() => []),
      getLeaveRequests().catch(() => []),
      getAnnouncements().catch(() => []),
      getNotifications().catch(() => []),
      employeesPromise,
      teamsPromise,
      projectsPromise,
      attendanceSummaryPromise,
      myAttendancePromise,
      taskViewerIdentityPromise,
    ]);

    const scopedTasks =
      isEmployee
        ? (hasTaskViewerIdentity(taskViewerIdentity) ? filterTasksForViewer(tasks, taskViewerIdentity) : [])
        : tasks;

    const scopedLeaves =
      isEmployee && hasTaskViewerIdentity(taskViewerIdentity)
        ? leaves.filter((leave) =>
          leave.employeeId === taskViewerIdentity?.employeeId || leave.employeeId === taskViewerIdentity?.userId
        )
        : leaves;

    const taskStatuses = mapStatusCounts(firstDefined(raw.myTasksByStatus, raw.tasksByStatus));
    const leaveStatuses = mapStatusCounts(firstDefined(raw.myLeavesByStatus, raw.leavesByStatus));
    const taskStatusSummary = toTaskStatusSummary(scopedTasks, taskStatuses);
    const leaveStatusSummary = toLeaveStatusSummary(scopedLeaves, leaveStatuses);

    const totalTasksFromDashboard = firstDefined(getNumber(raw.myTasksTotal), getNumber(raw.totalTasks), getNumber(raw.totalProjectTasks));
    const totalTasks = firstDefined(totalTasksFromDashboard, scopedTasks.length) ?? 0;
    const completedTasks = taskStatusSummary.DONE;
    const openTasks = Math.max(totalTasks - completedTasks, 0);

    const pendingLeavesFromDashboard = firstDefined(
      getNumber(raw.myPendingLeaves),
      getNumber(raw.pendingLeaveRequests),
      leaveStatusSummary.PENDING
    );

    const sortedRecentTasks = scopedTasks
      .slice()
      .sort((a, b) => {
        const left = toTimestamp(firstDefined(a.updatedAt, a.createdAt, a.dueDate));
        const right = toTimestamp(firstDefined(b.updatedAt, b.createdAt, b.dueDate));
        return right - left;
      });

    const sortedRecentLeaves = scopedLeaves
      .slice()
      .sort((a, b) => {
        const left = toTimestamp(firstDefined(a.updatedAt, a.createdAt, a.startDate));
        const right = toTimestamp(firstDefined(b.updatedAt, b.createdAt, b.startDate));
        return right - left;
      });

    const sortedDueTasks = scopedTasks
      .filter((task) => task.status !== "DONE" && Boolean(task.dueDate))
      .slice()
      .sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31"));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const dueWindowEnd = startOfToday.getTime() + (7 * DAY_MS);

    const dueSoonTasks = sortedDueTasks
      .filter((task) => {
        const timestamp = Date.parse(task.dueDate);
        if (Number.isNaN(timestamp)) return false;
        return timestamp >= startOfToday.getTime() && timestamp <= dueWindowEnd;
      })
      .slice(0, 5);

    const effectiveDueSoonTasks = dueSoonTasks.length > 0 ? dueSoonTasks : sortedDueTasks.slice(0, 5);

    const todayAttendance = asRecord(raw.todayAttendance);
    const adminAttendanceSummary: DashboardAttendanceSummary = {
      ...emptyAttendanceSummary(),
      total: firstDefined(
        getNumber(todayAttendance.totalCount),
        getNumber(raw.totalAttendance),
        dailyAttendanceSummary?.total
      ) ?? 0,
      present: firstDefined(
        getNumber(todayAttendance.presentCount),
        getNumber(raw.presentToday),
        getNumber(raw.todayPresent),
        dailyAttendanceSummary?.present
      ) ?? 0,
      late: firstDefined(
        getNumber(todayAttendance.lateCount),
        dailyAttendanceSummary?.late
      ) ?? 0,
      absent: firstDefined(
        getNumber(todayAttendance.absentCount),
        dailyAttendanceSummary?.absent
      ) ?? 0,
      halfDay: firstDefined(
        getNumber(todayAttendance.halfDayCount),
        dailyAttendanceSummary?.halfDay
      ) ?? 0,
      incomplete: firstDefined(
        getNumber(todayAttendance.incompleteCount),
        dailyAttendanceSummary?.incomplete
      ) ?? 0,
    };

    const attendanceWindowStart = new Date();
    attendanceWindowStart.setDate(attendanceWindowStart.getDate() - 29);
    const attendanceWindowStartIso = attendanceWindowStart.toISOString().slice(0, 10);
    const recentMyAttendance = myAttendanceRecords.filter((record) => record.date >= attendanceWindowStartIso);
    const employeeAttendanceSummary = summarizeAttendance(recentMyAttendance);
    const todayMyAttendance = myAttendanceRecords.find((record) => record.date === todayIso);

    const attendanceSummary: DashboardAttendanceSummary = isEmployee
      ? {
          ...employeeAttendanceSummary,
          myTodayStatus: todayMyAttendance?.status ?? "NOT_MARKED",
          myWorkedMinutes: todayMyAttendance?.workedMinutes ?? 0,
        }
      : adminAttendanceSummary;

    const presentToday = isEmployee
      ? (attendanceSummary.myTodayStatus === "PRESENT" || attendanceSummary.myTodayStatus === "LATE" || attendanceSummary.myTodayStatus === "HALF_DAY" ? 1 : 0)
      : attendanceSummary.present;

    return {
    totalEmployees: firstDefined(getNumber(raw.totalEmployees), getNumber(raw.employeeCount)) ?? (isEmployee ? 1 : employees.length),
    activeTeams: firstDefined(
      getNumber(raw.activeTeams),
      getNumber(raw.teamCount),
      getNumber(raw.totalTeams)
    ) ?? teams.filter((team) => team.status === "active").length,
    activeProjects: firstDefined(
      getNumber(raw.activeProjects),
      getNumber(raw.projectCount),
      getNumber(raw.managedProjects)
    ) ?? projects.filter((project) => project.status !== "completed" && project.status !== "cancelled").length,
    completedTasks,
    openTasks,
    pendingLeaves:
      pendingLeavesFromDashboard ??
      leaveStatusSummary.PENDING,
    presentToday,
    unreadNotifications: notifications.filter((notification) => !notification.read).length,
    taskStatusSummary,
    leaveStatusSummary,
    attendanceSummary,
    dueSoonTasks: effectiveDueSoonTasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority,
    })),
    recentTasks: sortedRecentTasks.slice(0, 5).map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority,
    })),
    recentLeaves: sortedRecentLeaves
      .slice(0, 5)
      .map((leave) => ({
        id: leave.id,
        employeeName: leave.employeeName,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        status: leave.status,
      })),
    pendingApprovals: sortedRecentLeaves
      .filter((leave) => leave.status === "PENDING")
      .slice(0, 5)
      .map((leave) => ({
        id: leave.id,
        employeeName: leave.employeeName,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        status: leave.status,
      })),
    announcements: announcements.slice(0, 4).map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      createdAt: announcement.createdAt,
    })),
    notifications: notifications.slice(0, 4).map((notification) => ({
      id: notification.id,
      title: notification.title,
      createdAt: notification.createdAt,
      read: notification.read,
      link: notification.link,
    })),
    recruitment: normalizeRecruitmentSummary(raw.recruitment),
    };
  } catch {
    return createEmptyTenantDashboardSnapshot();
  }
}

async function getTenantAnalyticsDataLegacy(): Promise<Partial<TenantAnalyticsData>> {
  const snapshotPromise = getTenantDashboardSnapshot();

  const now = new Date();
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - 29);

  const [snapshot, tasksByAssigneeRaw, projectProgressRaw, attendanceTrendRaw, roleDistributionRaw, tasks, leaves] = await Promise.all([
    snapshotPromise,
    fetchTenantAnalyticsPayload("/api/tenant/analytics/tasks/by-assignee"),
    fetchTenantAnalyticsPayload("/api/tenant/analytics/projects/progress"),
    fetchTenantAnalyticsPayload("/api/tenant/analytics/attendance/trend", {
      fromDate: fromDate.toISOString().slice(0, 10),
      toDate: now.toISOString().slice(0, 10),
    }),
    fetchTenantAnalyticsPayload("/api/tenant/analytics/employees/role-distribution"),
    getTasks(),
    getLeaveRequests(),
  ]);

  const taskStatusMap = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1;
    return acc;
  }, {});

  const leaveStatusMap = leaves.reduce<Record<string, number>>((acc, leave) => {
    acc[leave.status] = (acc[leave.status] ?? 0) + 1;
    return acc;
  }, {});

  const attendanceTrend = extractList(attendanceTrendRaw).map((item) => {
    const value = asRecord(item);
    return {
      date: toIsoDate(firstDefined(value.date, value.workDate, value.day)),
      present: getNumber(value.present) ?? 0,
      late: getNumber(value.late) ?? 0,
      halfDay: getNumber(value.halfDay) ?? getNumber(value.half_day) ?? 0,
      incomplete: getNumber(value.incomplete) ?? 0,
      absent: getNumber(value.absent) ?? 0,
    };
  });

  const upcomingDeadlines = tasks
    .slice()
    .sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31"))
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority,
    }));

  const roleDistribution = toDistributionFromUnknown(roleDistributionRaw);
  const fallbackEmployees = roleDistribution.reduce((sum, item) => sum + item.value, 0);

  return {
    totalEmployees: snapshot.totalEmployees || fallbackEmployees,
    activeProjects: snapshot.activeProjects,
    openTasks: snapshot.openTasks || tasks.filter((task) => task.status !== "DONE").length,
    pendingLeaves: snapshot.pendingLeaves || leaves.filter((leave) => leave.status === "PENDING").length,
    presentToday: snapshot.presentToday,
    taskStatusDistribution: toDistribution(taskStatusMap),
    projectProgress: toProgressFromUnknown(projectProgressRaw).slice(0, 6),
    workloadByEmployee: toProgressFromUnknown(tasksByAssigneeRaw).slice(0, 6),
    attendanceTrend,
    leaveStatusDistribution: toDistribution(leaveStatusMap),
    upcomingDeadlines,
  };
}

void getTenantAnalyticsDataLegacy;

export async function getTenantAnalyticsData(filters?: AnalyticsFilters): Promise<TenantAnalyticsData> {
  const role = normalizeAppRole(useAuthStore.getState().user?.role);
  const canWorkforce = role === 'TENANT_ADMIN' || role === 'HR';
  const canWork = role === 'TENANT_ADMIN' || role === 'MANAGER';
  const range = filters ?? { fromDate: '', toDate: '', department: '', projectId: '', teamId: '', employeeId: '', status: '', recruitmentStatus: '', attendancePeriod: 'daily', leaveType: '' };
  const snapshotPromise = getTenantDashboardSnapshot();
  const safePayload = (endpoint: string, params?: Record<string, string>) => fetchTenantAnalyticsPayload(endpoint, params).catch(() => []);
  const [snapshot, tasksRaw, leavesRaw, employees, teams, projects] = await Promise.all([
    snapshotPromise, getTasks().catch(() => []), getLeaveRequests().catch(() => []),
    canWorkforce ? getEmployees().catch(() => []) : Promise.resolve([]),
    getTeams().catch(() => []), getProjects().catch(() => []),
  ]);
  const tasks = tasksRaw.filter((task) =>
    (!range.projectId || task.projectId === range.projectId) &&
    (!range.teamId || task.assignedTeamId === range.teamId) &&
    (!range.employeeId || [task.assigneeId, task.assignedEmployeeId, task.assigneeEmployeeId].includes(range.employeeId)) &&
    (!range.status || task.status === range.status) &&
    (!range.fromDate || !task.dueDate || task.dueDate >= range.fromDate) && (!range.toDate || !task.dueDate || task.dueDate <= range.toDate)
  );
  const leaves = leavesRaw.filter((leave) => (!range.employeeId || leave.employeeId === range.employeeId) && (!range.status || leave.status === range.status) && (!range.fromDate || leave.endDate >= range.fromDate) && (!range.toDate || leave.startDate <= range.toDate));
  const [assigneeRaw, progressRaw, attendanceRaw, rolesRaw, designationsRaw] = await Promise.all([
    canWork ? safePayload('/api/tenant/analytics/tasks/by-assignee') : Promise.resolve([]),
    canWork ? safePayload('/api/tenant/analytics/projects/progress') : Promise.resolve([]),
    canWorkforce ? safePayload('/api/tenant/analytics/attendance/trend', { fromDate: range.fromDate, toDate: range.toDate }) : Promise.resolve([]),
    canWorkforce ? safePayload('/api/tenant/analytics/employees/role-distribution') : Promise.resolve([]),
    canWorkforce ? safePayload('/api/tenant/analytics/employees/designation-distribution') : Promise.resolve([]),
  ]);
  const taskCounts = tasks.reduce<Record<string, number>>((map, task) => ({ ...map, [task.status]: (map[task.status] ?? 0) + 1 }), {});
  const leaveCounts = leaves.reduce<Record<string, number>>((map, leave) => ({ ...map, [leave.status]: (map[leave.status] ?? 0) + 1 }), {});
  const attendanceTrend = extractList(attendanceRaw).map((item) => { const value = asRecord(item); return {
    date: toIsoDate(firstDefined(value.date, value.workDate)),
    present: firstDefined(getNumber(value.present), getNumber(value.presentCount)) ?? 0,
    late: firstDefined(getNumber(value.late), getNumber(value.lateCount)) ?? 0,
    halfDay: firstDefined(getNumber(value.halfDay), getNumber(value.halfDayCount)) ?? 0,
    incomplete: firstDefined(getNumber(value.incomplete), getNumber(value.incompleteCount)) ?? 0,
    absent: firstDefined(getNumber(value.absent), getNumber(value.absentCount)) ?? 0,
  }; });
  const now = new Date().toISOString().slice(0, 10);
  const previews = (items: Task[]) => items.map((task) => ({ id: task.id, title: task.title, dueDate: task.dueDate, status: task.status, priority: task.priority }));
  const openTasks = tasks.filter((task) => task.status !== 'DONE');
  const overdue = openTasks.filter((task) => task.dueDate && task.dueDate < now).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const upcoming = openTasks.filter((task) => task.dueDate && task.dueDate >= now).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const filteredEmployees = employees.filter((employee) => !range.department || employee.department === range.department);
  const teamMap = tasks.reduce<Record<string, number>>((map, task) => { const name = task.assignedTeamName ?? 'Unassigned'; map[name] = (map[name] ?? 0) + 1; return map; }, {});
  const teamWorkload = Object.entries(teamMap).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const completed = tasks.filter((task) => task.status === 'DONE').length;
  const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const blocked = taskCounts.BLOCKED ?? 0;
  const insights: BusinessInsight[] = [];
  if (overdue.length) insights.push({ id: 'overdue', severity: overdue.length > 5 ? 'critical' : 'warning', title: `${overdue.length} overdue task${overdue.length === 1 ? '' : 's'}`, description: 'Past-due work is increasing delivery risk. Review owners and unblock the oldest items first.', actionTo: tenantRoutes.tasks() });
  if (blocked) insights.push({ id: 'blocked', severity: 'warning', title: `${blocked} blocked item${blocked === 1 ? '' : 's'}`, description: 'Blocked work needs a dependency owner or escalation.' });
  if (completion >= 75) insights.push({ id: 'delivery', severity: 'positive', title: 'Strong delivery momentum', description: `${completion}% of work in the selected scope is complete.` });
  if (!insights.length) insights.push({ id: 'stable', severity: 'info', title: 'Operations are stable', description: 'No critical workload or deadline signals were detected for this filter range.' });

  return {
    totalEmployees: filteredEmployees.length || snapshot.totalEmployees,
    activeProjects: range.projectId ? projects.filter((project) => project.id === range.projectId).length : snapshot.activeProjects,
    openTasks: openTasks.length,
    pendingLeaves: leaves.filter((leave) => leave.status === 'PENDING').length,
    presentToday: attendanceTrend.at(-1)?.present ?? snapshot.presentToday,
    taskStatusDistribution: toDistribution(taskCounts),
    projectProgress: toProgressFromUnknown(progressRaw).slice(0, 10),
    workloadByEmployee: toProgressFromUnknown(assigneeRaw).slice(0, 10),
    attendanceTrend,
    leaveStatusDistribution: toDistribution(leaveCounts),
    upcomingDeadlines: previews(upcoming.slice(0, 8)),
    overdueTasks: previews(overdue.slice(0, 8)),
    employeeRoleDistribution: toDistributionFromUnknown(rolesRaw),
    employeeDesignationDistribution: toDistributionFromUnknown(designationsRaw),
    teamWorkload,
    filterOptions: {
      departments: [...new Set(employees.map((item) => item.department).filter(Boolean))].sort().map((item) => ({ value: String(item), label: String(item) })),
      projects: projects.map((item) => ({ value: item.id, label: item.name })),
      teams: teams.map((item) => ({ value: item.id, label: item.name })),
      employees: employees.map((item) => ({ value: item.id, label: item.name })),
    },
    insights,
    generatedAt: new Date().toISOString(),
  };
}

export async function getBusinessIntelligenceReport(filters: AnalyticsFilters): Promise<BusinessIntelligenceData> {
  const params: Record<string, string> = {};
  const mapping: Array<[string, string]> = [
    ['fromDate', filters.fromDate], ['toDate', filters.toDate], ['department', filters.department],
    ['projectId', filters.projectId], ['teamId', filters.teamId], ['employeeId', filters.employeeId],
    ['taskStatus', filters.status], ['recruitmentStatus', filters.recruitmentStatus], ['leaveType', filters.leaveType],
    ['attendancePeriod', filters.attendancePeriod],
  ];
  mapping.forEach(([key, value]) => { if (value) params[key] = value; });
  const { data } = await apiClient.get<ApiResponse<BusinessIntelligenceData> | BusinessIntelligenceData>(
    '/api/tenant/analytics/business-intelligence', { params },
  );
  return unwrapApiData(data);
}
