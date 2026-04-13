import type { TeamMemberFunctionalRole } from "@/modules/teams/types";
import type { PlatformRole, TenantRole } from "@/types";
import { PERMISSIONS, type Permission } from "@/constants/permissions";

export type AppRole = PlatformRole | TenantRole | string;
export type NormalizedAppRole = "PLATFORM_ADMIN" | "PLATFORM_USER" | "TENANT_ADMIN" | "HR" | "EMPLOYEE";

const ALL_TENANT_PERMISSIONS: Permission[] = [
  PERMISSIONS.TENANT_DASHBOARD_VIEW,
  PERMISSIONS.ATTENDANCE_VIEW,
  PERMISSIONS.LEAVE_VIEW,
  PERMISSIONS.ANNOUNCEMENTS_VIEW,
  PERMISSIONS.NOTIFICATIONS_VIEW,
  PERMISSIONS.CHAT_VIEW,
  PERMISSIONS.PROFILE_VIEW,
  PERMISSIONS.PROFILE_MANAGE,
  PERMISSIONS.SETTINGS_VIEW,
];

export const ROLE_PERMISSION_MAP: Record<NormalizedAppRole, Permission[]> = {
  PLATFORM_ADMIN: [
    PERMISSIONS.PLATFORM_DASHBOARD_VIEW,
    PERMISSIONS.PLATFORM_ANALYTICS_VIEW,
    PERMISSIONS.PLATFORM_TENANTS_VIEW,
    PERMISSIONS.PLATFORM_SETTINGS_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_MANAGE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE,
  ],
  PLATFORM_USER: [
    PERMISSIONS.PLATFORM_DASHBOARD_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_MANAGE,
  ],
  TENANT_ADMIN: [
    ...ALL_TENANT_PERMISSIONS,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.EMPLOYEES_MANAGE,
    PERMISSIONS.EMPLOYEE_STATUS_MANAGE,
    PERMISSIONS.EMPLOYEE_SKILLS_MANAGE,
    PERMISSIONS.TEAMS_VIEW,
    PERMISSIONS.TEAMS_MANAGE,
    PERMISSIONS.TEAM_MEMBERS_MANAGE,
    PERMISSIONS.TEAM_ROLES_MANAGE,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.PROJECTS_MANAGE,
    PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.PROJECT_DOCUMENTS_MANAGE,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_MANAGE,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.TASKS_DELETE,
    PERMISSIONS.TASK_ATTACHMENTS_MANAGE,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.LEAVE_REVIEW,
    PERMISSIONS.LEAVE_ATTACHMENTS_MANAGE,
    PERMISSIONS.ANNOUNCEMENTS_MANAGE,
    PERMISSIONS.HR_CHAT_START,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE,
  ],
  HR: [
    ...ALL_TENANT_PERMISSIONS,
    PERMISSIONS.LEAVE_REQUEST,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.EMPLOYEES_MANAGE,
    PERMISSIONS.EMPLOYEE_STATUS_MANAGE,
    PERMISSIONS.EMPLOYEE_SKILLS_MANAGE,
    PERMISSIONS.TEAMS_VIEW,
    PERMISSIONS.TEAMS_MANAGE,
    PERMISSIONS.TEAM_MEMBERS_MANAGE,
    PERMISSIONS.TEAM_ROLES_MANAGE,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.LEAVE_REVIEW,
    PERMISSIONS.LEAVE_ATTACHMENTS_MANAGE,
    PERMISSIONS.ANNOUNCEMENTS_MANAGE,
    PERMISSIONS.HR_CHAT_START,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  EMPLOYEE: [
    ...ALL_TENANT_PERMISSIONS,
    PERMISSIONS.LEAVE_REQUEST,
    PERMISSIONS.TEAMS_VIEW,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASK_ATTACHMENTS_MANAGE,
    PERMISSIONS.LEAVE_ATTACHMENTS_MANAGE,
  ],
};

export const TEAM_ROLE_PERMISSION_MAP: Record<TeamMemberFunctionalRole, Permission[]> = {
  MEMBER: [],
  PROJECT_MANAGER: [PERMISSIONS.TASKS_ASSIGN, PERMISSIONS.PROJECTS_EDIT],
  TEAM_LEAD: [PERMISSIONS.TASKS_ASSIGN],
  BUSINESS_ANALYST: [],
  DEVELOPER: [],
  QA: [],
  DESIGNER: [],
};

export function normalizeAppRole(role: AppRole | null | undefined): NormalizedAppRole | null {
  const normalized = String(role ?? "").trim().toUpperCase();

  if (!normalized) return null;
  if (normalized === "ADMIN" || normalized === "MANAGER") return "TENANT_ADMIN";
  if (normalized === "PLATFORM_ADMIN") return "PLATFORM_ADMIN";
  if (normalized === "PLATFORM_USER") return "PLATFORM_USER";
  if (normalized === "TENANT_ADMIN") return "TENANT_ADMIN";
  if (normalized === "HR") return "HR";
  if (normalized === "EMPLOYEE") return "EMPLOYEE";

  return null;
}

export function getRolePermissions(role: AppRole | null | undefined): Permission[] {
  const normalizedRole = normalizeAppRole(role);
  if (!normalizedRole) return [];
  return ROLE_PERMISSION_MAP[normalizedRole];
}

export function getTeamRolePermissions(teamRoles: TeamMemberFunctionalRole[] = []): Permission[] {
  const permissions = new Set<Permission>();

  teamRoles.forEach((teamRole) => {
    TEAM_ROLE_PERMISSION_MAP[teamRole]?.forEach((permission) => permissions.add(permission));
  });

  return Array.from(permissions);
}

export function getResolvedPermissions(
  role: AppRole | null | undefined,
  teamRoles: TeamMemberFunctionalRole[] = []
): Permission[] {
  return Array.from(new Set([...getRolePermissions(role), ...getTeamRolePermissions(teamRoles)]));
}

export function hasPermissionForRole(
  role: AppRole | null | undefined,
  permission: Permission,
  teamRoles: TeamMemberFunctionalRole[] = []
): boolean {
  return getResolvedPermissions(role, teamRoles).includes(permission);
}
