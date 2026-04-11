import { useMemo } from "react";
import type { TeamMemberFunctionalRole } from "@/modules/teams/types";
import { DEFAULT_PERMISSION_DENIED_MESSAGE, type Permission } from "@/constants/permissions";
import { getResolvedPermissions, normalizeAppRole } from "@/constants/rolePermissionMap";
import { useAuthStore } from "@/store/authStore";

interface PermissionOptions {
  teamRoles?: TeamMemberFunctionalRole[];
}

export function usePermission() {
  const user = useAuthStore((state) => state.user);

  const normalizedRole = useMemo(() => normalizeAppRole(user?.role), [user?.role]);
  const basePermissions = useMemo(() => getResolvedPermissions(user?.role), [user?.role]);

  function hasPermission(permission: Permission, options?: PermissionOptions): boolean {
    if (!user) return false;
    if (!options?.teamRoles?.length) {
      return basePermissions.includes(permission);
    }

    return getResolvedPermissions(user.role, options.teamRoles).includes(permission);
  }

  return {
    role: normalizedRole,
    permissions: basePermissions,
    hasPermission,
    getPermissionMessage: (message = DEFAULT_PERMISSION_DENIED_MESSAGE) => message,
  };
}
