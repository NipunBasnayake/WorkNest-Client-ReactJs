import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getNumber, getString, toIsoDate } from "@/services/http/parsers";
import { PERMISSIONS } from "@/constants/permissions";
import { getRolePermissions, normalizeAppRole } from "@/constants/rolePermissionMap";
import { useAuthStore } from "@/store/authStore";
import { getPlatformTenants } from "@/modules/platform/services/platformTenantService";
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
  PlatformAnalyticsData,
  ProgressDatum,
  TenantAnalyticsData,
  TenantDashboardSnapshot,
} from "@/modules/analytics/types";
import type { ApiResponse } from "@/types";
import type { AttendanceRecord } from "@/modules/attendance/types";
import type { LeaveRequest } from "@/modules/leave/types";
import type { Task } from "@/modules/tasks/types";

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
        const label = firstDefined(
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
    };
  } catch {
    return createEmptyTenantDashboardSnapshot();
  }
}

export async function getTenantAnalyticsData(): Promise<TenantAnalyticsData> {
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

export async function getPlatformAnalyticsData(): Promise<PlatformAnalyticsData> {
  const tenants = await getPlatformTenants();
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);

  const statusCount = tenants.reduce<Record<string, number>>((acc, tenant) => {
    const status = String(tenant.status ?? "active").toLowerCase();
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  const growthMap = tenants.reduce<Record<string, number>>((acc, tenant) => {
    if (!tenant.createdAt) return acc;
    const month = String(tenant.createdAt).slice(0, 7);
    if (!month) return acc;
    acc[month] = (acc[month] ?? 0) + 1;
    return acc;
  }, {});

  const tenantGrowthByMonth: ProgressDatum[] = Object.entries(growthMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-6);

  return {
    totalTenants: tenants.length,
    activeTenants: statusCount.active ?? 0,
    suspendedTenants: statusCount.suspended ?? 0,
    inactiveTenants: statusCount.inactive ?? 0,
    newlyAddedThisMonth: growthMap[currentMonth] ?? 0,
    tenantStatusDistribution: toDistribution(statusCount),
    tenantGrowthByMonth,
  };
}
