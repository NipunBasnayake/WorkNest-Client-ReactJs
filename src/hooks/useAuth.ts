import { useAuthStore } from "@/store/authStore";
import type { LoginPayload, SessionType, TenantRole, PlatformRole } from "@/types";

export function useAuth() {
  const {
    user,
    isAuthenticated,
    sessionType,
    tenantKey,
    isLoading,
    isBootstrapping,
    error,
    login,
    logout,
    bootstrap,
    clearError,
  } = useAuthStore();

  const isPlatform = sessionType === "platform";
  const isTenant   = sessionType === "tenant";

  const hasRole = (...roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isPlatformAdmin = () => hasRole("PLATFORM_ADMIN");
  const isTenantAdmin   = () => hasRole("ADMIN");
  const isManager       = () => hasRole("MANAGER");
  const isHR            = () => hasRole("HR");
  const isEmployee      = () => hasRole("EMPLOYEE");

  return {
    user,
    isAuthenticated,
    sessionType,
    tenantKey,
    isLoading,
    isBootstrapping,
    error,
    isPlatform,
    isTenant,
    hasRole,
    isPlatformAdmin,
    isTenantAdmin,
    isManager,
    isHR,
    isEmployee,
    login: (payload: LoginPayload) => login(payload),
    logout,
    bootstrap,
    clearError,
  };
}

export type { SessionType, TenantRole, PlatformRole };
