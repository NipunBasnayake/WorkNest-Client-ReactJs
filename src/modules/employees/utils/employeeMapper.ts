import type { Employee } from "@/types";
import type { EmployeeFormValues, EmployeeRole, EmployeeViewModel } from "@/modules/employees/types";

function pickString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeStatus(value: unknown): "active" | "inactive" {
  const raw = pickString(value)?.toUpperCase();
  return raw === "INACTIVE" || raw === "inactive" ? "inactive" : "active";
}

function normalizeRole(value: unknown): EmployeeRole {
  const raw = pickString(value)?.toUpperCase();
  if (raw === "TENANT_ADMIN" || raw === "ADMIN" || raw === "MANAGER" || raw === "HR" || raw === "EMPLOYEE") {
    return raw as EmployeeRole;
  }
  return "EMPLOYEE";
}

function buildName(employee: Employee): string {
  const firstName = pickString(employee.firstName);
  const lastName = pickString(employee.lastName);
  const explicitName = pickString(employee.name);
  if (firstName || lastName) {
    return `${firstName ?? ""} ${lastName ?? ""}`.trim();
  }
  return explicitName ?? "Unknown Employee";
}

export function getEmployeeDisplayName(employee: Employee): string {
  return buildName(employee);
}

export function toEmployeeViewModel(employee: Employee): EmployeeViewModel {
  const salaryRaw = employee.salary;
  const salary = typeof salaryRaw === "number" ? salaryRaw : Number(salaryRaw);

  return {
    ...employee,
    displayName: buildName(employee),
    firstName: pickString(employee.firstName),
    lastName: pickString(employee.lastName),
    position: pickString(employee.position) ?? pickString(employee.designation),
    status: normalizeStatus(employee.status),
    role: normalizeRole(employee.role),
    joinedAt: pickString(employee.joinedAt) ?? pickString(employee.joinedDate),
    salary: Number.isFinite(salary) ? salary : undefined,
  };
}

export function toEmployeeFormValues(employee: Employee): EmployeeFormValues {
  const view = toEmployeeViewModel(employee);
  const [fallbackFirst = "", ...rest] = view.displayName.split(" ");
  const fallbackLast = rest.join(" ");

  return {
    employeeCode: pickString(employee.employeeCode) ?? generateEmployeeCode(view.displayName),
    firstName: view.firstName ?? fallbackFirst,
    lastName: view.lastName ?? fallbackLast,
    email: pickString(view.email) ?? "",
    password: "",
    phone: pickString(view.phone) ?? "",
    position: view.position ?? "",
    department: pickString(view.department) ?? "",
    role: normalizeRole(view.role),
    joinedDate: pickString(view.joinedAt) ?? new Date().toISOString().slice(0, 10),
    salary: view.salary !== undefined ? String(view.salary) : "",
    status: normalizeStatus(view.status),
  };
}

export function toEmployeePayload(values: EmployeeFormValues) {
  const salary = values.salary.trim() ? Number(values.salary) : undefined;
  const password = values.password.trim();

  return {
    employeeCode: values.employeeCode.trim(),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    password: password || undefined,
    role: values.role,
    designation: values.position.trim(),
    joinedDate: values.joinedDate,
    status: values.status === "inactive" ? "INACTIVE" : "ACTIVE",
    phone: values.phone.trim() || undefined,
    department: values.department.trim() || undefined,
    salary: salary !== undefined && Number.isFinite(salary) ? salary : undefined,
  };
}

export function generateEmployeeCode(seed?: string): string {
  const normalizedSeed = seed?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4) || "EMP";
  const stamp = Date.now().toString().slice(-5);
  return `${normalizedSeed}-${stamp}`;
}
