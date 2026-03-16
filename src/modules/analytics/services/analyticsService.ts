import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getNumber, getString, toIsoDate } from "@/services/http/parsers";
import { useAuthStore } from "@/store/authStore";
import { getPlatformTenants } from "@/modules/platform/services/platformTenantService";
import { getTasks } from "@/modules/tasks/services/taskService";
import { getLeaveRequests } from "@/modules/leave/services/leaveService";
import { getAnnouncements } from "@/modules/announcements/services/announcementService";
import { getNotifications } from "@/modules/notifications/services/notificationService";
import type {
  DistributionDatum,
  PlatformAnalyticsData,
  ProgressDatum,
  TenantAnalyticsData,
  TenantDashboardSnapshot,
} from "@/modules/analytics/types";
import type { ApiResponse } from "@/types";

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
  ADMIN: "#9332EA",
  TENANT_ADMIN: "#9332EA",
  MANAGER: "#6366f1",
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
  const role = (useAuthStore.getState().user?.role ?? "").toString().toUpperCase();
  if (role === "ADMIN" || role === "TENANT_ADMIN") return "/api/tenant/dashboard/tenant-admin";
  if (role === "MANAGER") return "/api/tenant/dashboard/manager";
  if (role === "HR") return "/api/tenant/dashboard/hr";
  return "/api/tenant/dashboard/me";
}

async function fetchDashboardRaw(): Promise<unknown> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(roleDashboardEndpoint());
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

export async function getTenantDashboardSnapshot(): Promise<TenantDashboardSnapshot> {
  try {
    const raw = asRecord(await fetchDashboardRaw());
    const role = (useAuthStore.getState().user?.role ?? "").toString().toUpperCase();
    const currentUserId = useAuthStore.getState().user?.id;

    const [tasks, leaves, announcements, notifications] = await Promise.all([
      getTasks().catch(() => []),
      getLeaveRequests().catch(() => []),
      getAnnouncements().catch(() => []),
      getNotifications().catch(() => []),
    ]);

    const scopedTasks =
      role === "EMPLOYEE" && currentUserId
        ? tasks.filter((task) => task.assigneeId === currentUserId)
        : tasks;

    const scopedLeaves =
      role === "EMPLOYEE" && currentUserId
        ? leaves.filter((leave) => leave.employeeId === currentUserId)
        : leaves;

    const taskStatuses = mapStatusCounts(firstDefined(raw.myTasksByStatus, raw.tasksByStatus));
    const leaveStatuses = mapStatusCounts(raw.leavesByStatus);

    const totalTasksFromDashboard = firstDefined(getNumber(raw.myTasksTotal), getNumber(raw.totalTasks), getNumber(raw.totalProjectTasks));
    const doneTasksFromDashboard = firstDefined(taskStatuses.DONE, taskStatuses.COMPLETED) ?? 0;
    const openTasksFromDashboard =
      totalTasksFromDashboard !== undefined
        ? Math.max(totalTasksFromDashboard - doneTasksFromDashboard, 0)
        : undefined;

    const pendingLeavesFromDashboard = firstDefined(
      getNumber(raw.myPendingLeaves),
      getNumber(raw.pendingLeaveRequests),
      leaveStatuses.PENDING
    );

    const presentTodayFromDashboard = firstDefined(
      getNumber(asRecord(raw.todayAttendance).presentCount),
      getNumber(raw.presentToday),
      getNumber(raw.todayPresent)
    );

    return {
      totalEmployees: firstDefined(getNumber(raw.totalEmployees), getNumber(raw.employeeCount)) ?? (role === "EMPLOYEE" ? 1 : 0),
      activeProjects: firstDefined(
        getNumber(raw.activeProjects),
        getNumber(raw.projectCount),
        getNumber(raw.managedProjects)
      ) ?? 0,
      openTasks:
        openTasksFromDashboard ??
        scopedTasks.filter((task) => task.status !== "DONE").length,
      pendingLeaves:
        pendingLeavesFromDashboard ??
        scopedLeaves.filter((leave) => leave.status === "PENDING").length,
      presentToday: presentTodayFromDashboard ?? 0,
      recentTasks: scopedTasks.slice(0, 5).map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
      })),
      pendingApprovals: scopedLeaves
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
      })),
    };
  } catch {
    const [tasks, leaves, announcements, notifications] = await Promise.all([
      getTasks().catch(() => []),
      getLeaveRequests().catch(() => []),
      getAnnouncements().catch(() => []),
      getNotifications().catch(() => []),
    ]);

    return {
      totalEmployees: 0,
      activeProjects: 0,
      openTasks: tasks.filter((task) => task.status !== "DONE").length,
      pendingLeaves: leaves.filter((leave) => leave.status === "PENDING").length,
      presentToday: 0,
      recentTasks: tasks.slice(0, 5).map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
      })),
      pendingApprovals: leaves
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
      })),
    };
  }
}

export async function getTenantAnalyticsData(): Promise<TenantAnalyticsData> {
  const snapshotPromise = getTenantDashboardSnapshot().catch(() => ({
    totalEmployees: 0,
    activeProjects: 0,
    openTasks: 0,
    pendingLeaves: 0,
    presentToday: 0,
    recentTasks: [],
    pendingApprovals: [],
    announcements: [],
    notifications: [],
  }));

  const now = new Date();
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - 29);

  const [snapshot, tasksByAssigneeRaw, projectProgressRaw, attendanceTrendRaw, roleDistributionRaw, tasks, leaves] = await Promise.all([
    snapshotPromise,
    apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/analytics/tasks/by-assignee").then((res) => unwrapApiData<unknown>(res.data)).catch(() => []),
    apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/analytics/projects/progress").then((res) => unwrapApiData<unknown>(res.data)).catch(() => []),
    apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/analytics/attendance/trend", {
      params: { fromDate: fromDate.toISOString().slice(0, 10), toDate: now.toISOString().slice(0, 10) },
    }).then((res) => unwrapApiData<unknown>(res.data)).catch(() => []),
    apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/analytics/employees/role-distribution").then((res) => unwrapApiData<unknown>(res.data)).catch(() => []),
    getTasks().catch(() => []),
    getLeaveRequests().catch(() => []),
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
  const tenants = await getPlatformTenants().catch(() => []);
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
