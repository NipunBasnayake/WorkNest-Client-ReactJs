import type { Employee } from "@/types";

export type EmployeeStatus = "active" | "inactive";

export interface EmployeeFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: string;
  status: EmployeeStatus;
}

export type EmployeeFormErrors = Partial<Record<keyof EmployeeFormValues, string>>;

export interface EmployeeViewModel extends Employee {
  displayName: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  salary?: number;
}
