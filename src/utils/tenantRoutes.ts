import { tokenStorage } from "@/services/auth/tokenStorage";
import type { SessionType } from "@/types";

/**
 * Centralized tenant-aware route builder.
 *
 * Use these helpers instead of hardcoding tenant paths. They resolve the
 * current tenant slug from an explicit override, the active browser URL, or
 * the stored auth context so tenant navigation remains canonical.
 */

const RESERVED_TOP_LEVEL_SEGMENTS = new Set([
  "",
  "app",
  "platform",
  "login",
  "register",
  "register-company",
  "forgot-password",
  "reset-password",
  "force-password-change",
  "unauthorized",
]);

function getTenantSlugFromPath(): string | null {
  if (typeof window === "undefined") return null;
  const [firstSegment = ""] = window.location.pathname.split("/").filter(Boolean);
  if (!firstSegment || RESERVED_TOP_LEVEL_SEGMENTS.has(firstSegment)) return null;
  return firstSegment;
}

function getTenantSlug(override?: string): string {
  return override ?? getTenantSlugFromPath() ?? tokenStorage.getTenantKey() ?? "app";
}

export const tenantRoutes = {
  path: (route: string, tenantOverride?: string): string => {
    const cleanRoute = route.startsWith("/") ? route : `/${route}`;
    return `/${getTenantSlug(tenantOverride)}${cleanRoute}`;
  },

  dashboard: (tenantOverride?: string) => tenantRoutes.path("/dashboard", tenantOverride),
  analytics: (tenantOverride?: string) => tenantRoutes.path("/analytics", tenantOverride),
  reports: (tenantOverride?: string) => tenantRoutes.path("/reports", tenantOverride),
  auditLogs: (tenantOverride?: string) => tenantRoutes.path("/audit-logs", tenantOverride),

  employees: (tenantOverride?: string) => tenantRoutes.path("/employees", tenantOverride),
  employeeDetail: (id: string, tenantOverride?: string) => tenantRoutes.path(`/employees/${id}`, tenantOverride),
  employeeNew: (tenantOverride?: string) => tenantRoutes.path("/employees/new", tenantOverride),
  employeeEdit: (id: string, tenantOverride?: string) => tenantRoutes.path(`/employees/${id}/edit`, tenantOverride),

  teams: (tenantOverride?: string) => tenantRoutes.path("/teams", tenantOverride),
  teamDetail: (id: string, tenantOverride?: string) => tenantRoutes.path(`/teams/${id}`, tenantOverride),
  teamNew: (tenantOverride?: string) => tenantRoutes.path("/teams/new", tenantOverride),
  teamEdit: (id: string, tenantOverride?: string) => tenantRoutes.path(`/teams/${id}/edit`, tenantOverride),

  projects: (tenantOverride?: string) => tenantRoutes.path("/projects", tenantOverride),
  projectDetail: (id: string, tenantOverride?: string) => tenantRoutes.path(`/projects/${id}`, tenantOverride),
  projectNew: (tenantOverride?: string) => tenantRoutes.path("/projects/new", tenantOverride),
  projectEdit: (id: string, tenantOverride?: string) => tenantRoutes.path(`/projects/${id}/edit`, tenantOverride),

  tasks: (tenantOverride?: string) => tenantRoutes.path("/tasks", tenantOverride),
  taskBoard: (tenantOverride?: string) => tenantRoutes.path("/tasks/board", tenantOverride),
  taskDetail: (id: string, tenantOverride?: string) => tenantRoutes.path(`/tasks/${id}`, tenantOverride),
  taskCreate: (tenantOverride?: string) => tenantRoutes.path("/tasks/create", tenantOverride),
  taskNew: (tenantOverride?: string) => tenantRoutes.taskCreate(tenantOverride),
  taskEdit: (id: string, tenantOverride?: string) => tenantRoutes.path(`/tasks/${id}/edit`, tenantOverride),

  attendance: (tenantOverride?: string) => tenantRoutes.path("/attendance", tenantOverride),
  leave: (tenantOverride?: string) => tenantRoutes.path("/leave", tenantOverride),
  leaveDetail: (id: string, tenantOverride?: string) => tenantRoutes.path(`/leave/${id}`, tenantOverride),
  leaveNew: (tenantOverride?: string) => tenantRoutes.path("/leave/new", tenantOverride),
  leaveEdit: (id: string, tenantOverride?: string) => tenantRoutes.path(`/leave/${id}/edit`, tenantOverride),

  recruitment: (tenantOverride?: string) => tenantRoutes.recruitmentJobs(tenantOverride),
  recruitmentPipeline: (tenantOverride?: string) => tenantRoutes.recruitmentApplications(tenantOverride),
  recruitmentJobs: (tenantOverride?: string) => tenantRoutes.path("/recruitment/jobs", tenantOverride),
  recruitmentJobNew: (tenantOverride?: string) => tenantRoutes.path("/recruitment/jobs/new", tenantOverride),
  recruitmentJobEdit: (id: string, tenantOverride?: string) => tenantRoutes.path(`/recruitment/jobs/${id}/edit`, tenantOverride),
  recruitmentJobPreview: (id: string, tenantOverride?: string) => tenantRoutes.path(`/recruitment/jobs/${id}/preview`, tenantOverride),
  recruitmentJobApplications: (id: string, tenantOverride?: string) => tenantRoutes.path(`/recruitment/applications?jobPositionId=${encodeURIComponent(id)}`, tenantOverride),
  recruitmentApplications: (tenantOverride?: string) => tenantRoutes.path("/recruitment/applications", tenantOverride),
  recruitmentApplication: (id: string, tenantOverride?: string) => tenantRoutes.path(`/recruitment/applications/${id}`, tenantOverride),
  recruitmentEmailTemplates: (tenantOverride?: string) => tenantRoutes.path("/recruitment/email-templates", tenantOverride),

  announcements: (tenantOverride?: string) => tenantRoutes.path("/announcements", tenantOverride),
  announcementDetail: (id: string, tenantOverride?: string) => tenantRoutes.path(`/announcements/${id}`, tenantOverride),
  announcementNew: (tenantOverride?: string) => tenantRoutes.path("/announcements/new", tenantOverride),
  announcementEdit: (id: string, tenantOverride?: string) => tenantRoutes.path(`/announcements/${id}/edit`, tenantOverride),

  notifications: (tenantOverride?: string) => tenantRoutes.path("/notifications", tenantOverride),
  chat: (tenantOverride?: string) => tenantRoutes.path("/chat", tenantOverride),

  profile: (tenantOverride?: string) => tenantRoutes.path("/profile", tenantOverride),
  settings: (tenantOverride?: string) => tenantRoutes.path("/settings", tenantOverride),
  settingsProfile: (tenantOverride?: string) => tenantRoutes.path("/settings/profile", tenantOverride),
  settingsWorkspace: (tenantOverride?: string) => tenantRoutes.path("/settings/workspace", tenantOverride),
  settingsPreferences: (tenantOverride?: string) => tenantRoutes.path("/settings/preferences", tenantOverride),
  settingsSecurity: (tenantOverride?: string) => tenantRoutes.path("/settings/security", tenantOverride),
};

export const platformRoutes = {
  path: (route: string): string => {
    const cleanRoute = route.startsWith("/") ? route : `/${route}`;
    return `/platform${cleanRoute}`;
  },
  dashboard: () => platformRoutes.path("/dashboard"),
  analytics: () => platformRoutes.path("/analytics"),
  reports: () => platformRoutes.path("/reports"),
  tenants: () => platformRoutes.path("/tenants"),
  tenantDetail: (tenantKey: string) => platformRoutes.path(`/tenants/${tenantKey}`),
  users: () => platformRoutes.path("/users"),
  auditLogs: () => platformRoutes.path("/audit-logs"),
  profile: () => platformRoutes.path("/profile"),
};

export const authRoutes = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  resetPasswordWithToken: (token: string) => `/reset-password/${token}`,
  forcePasswordChange: "/force-password-change",
  unauthorized: "/unauthorized",
};

export function getDefaultPostLoginRedirect(sessionType?: SessionType | null, tenantSlug?: string | null): string {
  if (sessionType === "platform") return platformRoutes.dashboard();
  return tenantRoutes.dashboard(tenantSlug ?? undefined);
}
