import { useAuthStore } from "@/store/authStore";
import { hasTenantRole } from "@/constants/access";
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
    passwordChangeRequired,
    passwordChangeChallenge,
    login,
    logout,
    bootstrap,
    clearError,
    setPasswordChangeChallenge,
    completePasswordChange,
  } = useAuthStore();

  const isPlatform = sessionType === "platform";
  const isTenant   = sessionType === "tenant";

  const hasRole = (...roles: string[]): boolean => {
    if (!user) return false;
    return hasTenantRole(user.role, roles as TenantRole[]);
  };

  const isPlatformAdmin = () => hasRole("PLATFORM_ADMIN");
  const isTenantAdmin   = () => hasRole("TENANT_ADMIN", "ADMIN");
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
    passwordChangeRequired,
    passwordChangeChallenge,
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
    setPasswordChangeChallenge,
    completePasswordChange,
  };
}

export type { SessionType, TenantRole, PlatformRole };
