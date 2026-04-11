import { useAuthStore } from "@/store/authStore";
import { normalizeAppRole } from "@/constants/rolePermissionMap";
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
  const normalizedRole = normalizeAppRole(user?.role);
  const isPlatformAdmin = () => normalizedRole === "PLATFORM_ADMIN";
  const isTenantAdmin   = () => normalizedRole === "TENANT_ADMIN";
  const isHR            = () => normalizedRole === "HR";
  const isEmployee      = () => normalizedRole === "EMPLOYEE";

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
    role: normalizedRole,
    isPlatformAdmin,
    isTenantAdmin,
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
