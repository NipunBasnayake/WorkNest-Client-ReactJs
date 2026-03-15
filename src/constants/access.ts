import type { TenantRole } from "@/types";

export const TENANT_ALL_ROLES: TenantRole[] = ["ADMIN", "MANAGER", "HR", "EMPLOYEE"];
export const TENANT_MANAGERIAL_ROLES: TenantRole[] = ["ADMIN", "MANAGER"];
export const TENANT_PEOPLE_ROLES: TenantRole[] = ["ADMIN", "MANAGER", "HR"];
export const TENANT_COMMUNICATION_ROLES: TenantRole[] = ["ADMIN", "MANAGER", "HR"];

export const TENANT_MODULE_ACCESS: Record<
  | "employees"
  | "teams"
  | "projects"
  | "tasks"
  | "attendance"
  | "leave"
  | "announcements"
  | "notifications",
  TenantRole[]
> = {
  employees: ["ADMIN", "MANAGER", "HR"],
  teams: ["ADMIN", "MANAGER"],
  projects: ["ADMIN", "MANAGER"],
  tasks: ["ADMIN", "MANAGER", "HR", "EMPLOYEE"],
  attendance: ["ADMIN", "MANAGER", "HR", "EMPLOYEE"],
  leave: ["ADMIN", "MANAGER", "HR", "EMPLOYEE"],
  announcements: ["ADMIN", "MANAGER", "HR", "EMPLOYEE"],
  notifications: ["ADMIN", "MANAGER", "HR", "EMPLOYEE"],
};
