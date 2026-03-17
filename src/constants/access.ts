import type { TenantRole } from "@/types";

export const TENANT_ADMIN_EQUIVALENT_ROLES: TenantRole[] = ["TENANT_ADMIN", "ADMIN"];

export const TENANT_ALL_ROLES: TenantRole[] = ["TENANT_ADMIN", "ADMIN", "MANAGER", "HR", "EMPLOYEE"];
export const TENANT_MANAGERIAL_ROLES: TenantRole[] = ["TENANT_ADMIN", "ADMIN", "MANAGER"];
export const TENANT_PEOPLE_ROLES: TenantRole[] = ["TENANT_ADMIN", "ADMIN", "MANAGER", "HR"];
export const TENANT_COMMUNICATION_ROLES: TenantRole[] = ["TENANT_ADMIN", "ADMIN", "MANAGER", "HR"];
export const TENANT_TEAM_MANAGEMENT_ROLES: TenantRole[] = ["TENANT_ADMIN", "ADMIN", "MANAGER", "HR"];
export const TENANT_TEAM_VIEW_ROLES: TenantRole[] = [...TENANT_TEAM_MANAGEMENT_ROLES, "EMPLOYEE"];
export const TENANT_PROJECT_MANAGEMENT_ROLES: TenantRole[] = ["TENANT_ADMIN", "ADMIN", "MANAGER"];
export const TENANT_PROJECT_VIEW_ROLES: TenantRole[] = [...TENANT_PROJECT_MANAGEMENT_ROLES, "HR", "EMPLOYEE"];
export const TENANT_TASK_MANAGEMENT_ROLES: TenantRole[] = ["TENANT_ADMIN", "ADMIN", "MANAGER"];
export const TENANT_TASK_VIEW_ROLES: TenantRole[] = [...TENANT_TASK_MANAGEMENT_ROLES, "HR", "EMPLOYEE"];

function normalizeTenantRole(role: string | null | undefined): string {
  const normalized = (role ?? "").toUpperCase();
  if (normalized === "TENANT_ADMIN") return "ADMIN";
  return normalized;
}

export function hasTenantRole(userRole: string | null | undefined, allowedRoles: TenantRole[]): boolean {
  const normalizedUserRole = normalizeTenantRole(userRole);
  const normalizedAllowed = new Set(allowedRoles.map((role) => normalizeTenantRole(role)));
  return normalizedAllowed.has(normalizedUserRole);
}

export const TENANT_MODULE_ACCESS: Record<
  | "employees"
  | "teams"
  | "projects"
  | "tasks"
  | "attendance"
  | "leave"
  | "announcements"
  | "notifications"
  | "chat"
  | "analytics",
  TenantRole[]
> = {
  employees: ["TENANT_ADMIN", "ADMIN", "MANAGER", "HR"],
  teams: TENANT_TEAM_MANAGEMENT_ROLES,
  projects: TENANT_PROJECT_MANAGEMENT_ROLES,
  tasks: TENANT_TASK_VIEW_ROLES,
  attendance: ["TENANT_ADMIN", "ADMIN", "MANAGER", "HR", "EMPLOYEE"],
  leave: ["TENANT_ADMIN", "ADMIN", "MANAGER", "HR", "EMPLOYEE"],
  announcements: ["TENANT_ADMIN", "ADMIN", "MANAGER", "HR", "EMPLOYEE"],
  notifications: ["TENANT_ADMIN", "ADMIN", "MANAGER", "HR", "EMPLOYEE"],
  chat: ["TENANT_ADMIN", "ADMIN", "MANAGER", "HR", "EMPLOYEE"],
  analytics: ["TENANT_ADMIN", "ADMIN", "MANAGER", "HR"],
};
