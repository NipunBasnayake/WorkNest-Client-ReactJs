import type { SessionType } from "@/types";

/**
 * Centralised tenant-aware route builder.
 *
 * Use these helpers instead of hardcoding paths like `/app/dashboard`.
 * They resolve the current tenant slug from the auth store automatically
 * so all navigation stays consistent after the `/:tenant/...` routing structure.
 *
 * Usage (inside a React component or hook — store must be ready):
 *   tenantRoutes.dashboard()       → "/acme-corp/dashboard"
 *   tenantRoutes.employees("acme") → "/acme/employees"
 *   platformRoutes.dashboard()     → "/platform/dashboard"
 *   authRoutes.login()             → "/login"
 */

/* ── In-memory cache refreshed lazily ── */

let cachedTenantKey: string | null = null;
let cachedSessionType: SessionType | null = null;

/**
 * Lazily sync the cached values from the auth store.
 * Uses a dynamic import so the module can be imported before the store is
 * initialised (circular-safe), and switches to a direct getter after the
 * first successful read.
 */
let refreshCache: () => void = () => {
  import("@/store/authStore")
    .then(({ useAuthStore }) => {
      try {
        const state = useAuthStore.getState();
        cachedTenantKey = state.tenantKey;
        cachedSessionType = state.sessionType;
      } catch {
        // Store not ready yet
      }
      // Subsequent calls go straight to the store
      refreshCache = () => {
        try {
          const state = useAuthStore.getState();
          cachedTenantKey = state.tenantKey;
          cachedSessionType = state.sessionType;
        } catch {
          // Keep previous cache
        }
      };
    })
    .catch(() => {
      // Module not available – keep defaults
      refreshCache = () => {};
    });
};

function getTenantSlug(override?: string): string {
  if (override) return override;
  refreshCache();
  return cachedTenantKey ?? "app";
}

/* ── Route builders ── */

export const tenantRoutes = {
  /** Builds a path scoped to the active tenant. */
  path: (route: string, tenantOverride?: string): string => {
    const cleanRoute = route.startsWith("/") ? route : `/${route}`;
    return `/${getTenantSlug(tenantOverride)}${cleanRoute}`;
  },

  /* ── Overview ── */
  dashboard: (tenantOverride?: string) => tenantRoutes.path("/dashboard", tenantOverride),
  analytics: (tenantOverride?: string) => tenantRoutes.path("/analytics", tenantOverride),

  /* ── People ── */
  employees: (tenantOverride?: string) => tenantRoutes.path("/employees", tenantOverride),
  employeeDetail: (id: string, tenantOverride?: string) => tenantRoutes.path(`/employees/${id}`, tenantOverride),
  employeeNew: (tenantOverride?: string) => tenantRoutes.path("/employees/new", tenantOverride),
  employeeEdit: (id: string, tenantOverride?: string) => tenantRoutes.path(`/employees/${id}/edit`, tenantOverride),
  teams: (tenantOverride?: string) => tenantRoutes.path("/teams", tenantOverride),
  teamDetail: (id: string, tenantOverride?: string) => tenantRoutes.path(`/teams/${id}`, tenantOverride),
  teamNew: (tenantOverride?: string) => tenantRoutes.path("/teams/new", tenantOverride),
  teamEdit: (id: string, tenantOverride?: string) => tenantRoutes.path(`/teams/${id}/edit`, tenantOverride),

  /* ── Work ── */
  projects: (tenantOverride?: string) => tenantRoutes.path("/projects", tenantOverride),
  projectDetail: (id: string, tenantOverride?: string) => tenantRoutes.path(`/projects/${id}`, tenantOverride),
  projectNew: (tenantOverride?: string) => tenantRoutes.path("/projects/new", tenantOverride),
  projectEdit: (id: string, tenantOverride?: string) => tenantRoutes.path(`/projects/${id}/edit`, tenantOverride),
  tasks: (tenantOverride?: string) => tenantRoutes.path("/tasks", tenantOverride),
  taskBoard: (tenantOverride?: string) => tenantRoutes.path("/tasks/board", tenantOverride),
  taskDetail: (id: string, tenantOverride?: string) => tenantRoutes.path(`/tasks/${id}`, tenantOverride),
  taskNew: (tenantOverride?: string) => tenantRoutes.path("/tasks/new", tenantOverride),
  taskEdit: (id: string, tenantOverride?: string) => tenantRoutes.path(`/tasks/${id}/edit`, tenantOverride),

  /* ── HR ── */
  attendance: (tenantOverride?: string) => tenantRoutes.path("/attendance", tenantOverride),
  leave: (tenantOverride?: string) => tenantRoutes.path("/leave", tenantOverride),
  leaveDetail: (id: string, tenantOverride?: string) => tenantRoutes.path(`/leave/${id}`, tenantOverride),
  leaveNew: (tenantOverride?: string) => tenantRoutes.path("/leave/new", tenantOverride),
  leaveEdit: (id: string, tenantOverride?: string) => tenantRoutes.path(`/leave/${id}/edit`, tenantOverride),
  recruitment: (tenantOverride?: string) => tenantRoutes.path("/recruitment", tenantOverride),
  recruitmentDashboard: (tenantOverride?: string) => tenantRoutes.path("/recruitment/dashboard", tenantOverride),
  recruitmentPipeline: (tenantOverride?: string) => tenantRoutes.path("/recruitment/pipeline", tenantOverride),
  recruitmentJobs: (tenantOverride?: string) => tenantRoutes.path("/recruitment/jobs", tenantOverride),

  /* ── Communication ── */
  announcements: (tenantOverride?: string) => tenantRoutes.path("/announcements", tenantOverride),
  announcementDetail: (id: string, tenantOverride?: string) => tenantRoutes.path(`/announcements/${id}`, tenantOverride),
  announcementNew: (tenantOverride?: string) => tenantRoutes.path("/announcements/new", tenantOverride),
  announcementEdit: (id: string, tenantOverride?: string) => tenantRoutes.path(`/announcements/${id}/edit`, tenantOverride),
  notifications: (tenantOverride?: string) => tenantRoutes.path("/notifications", tenantOverride),
  chat: (tenantOverride?: string) => tenantRoutes.path("/chat", tenantOverride),

  /* ── Account ── */
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
  tenants: () => platformRoutes.path("/tenants"),
  tenantDetail: (tenantKey: string) => platformRoutes.path(`/tenants/${tenantKey}`),
  profile: () => platformRoutes.path("/profile"),
  settings: () => platformRoutes.path("/settings"),
};

export const authRoutes = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  resetPasswordWithToken: (token: string) => `/reset-password/${token}`,
  forcePasswordChange: "/force-password-change",
  sessionExpired: "/session-expired",
  unauthorized: "/unauthorized",
};

/** Resolve the default redirect after login based on session type. */
export function getDefaultPostLoginRedirect(sessionType?: SessionType | null, tenantSlug?: string | null): string {
  if (sessionType === "platform") return platformRoutes.dashboard();
  return tenantRoutes.dashboard(tenantSlug ?? undefined);
}
