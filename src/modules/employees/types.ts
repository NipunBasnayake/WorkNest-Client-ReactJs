import type { Employee, TenantRole } from "@/types";

export type EmployeeStatus = "active" | "inactive";
export type EmployeeRole = TenantRole;

export interface EmployeeSkill {
  id: string;
  name: string;
}

export interface EmployeeSkillPayload {
  name: string;
}

export interface SkillSuggestion {
  name: string;
}

export interface EmployeeFormValues {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  position: string;
  department: string;
  role: EmployeeRole;
  joinedDate: string;
  salary: string;
  status: EmployeeStatus;
  skills: EmployeeSkillPayload[];
}

export type EmployeeFormErrors = Partial<Record<keyof EmployeeFormValues, string>>;

export interface EmployeeViewModel extends Employee {
  displayName: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  salary?: number;
}
