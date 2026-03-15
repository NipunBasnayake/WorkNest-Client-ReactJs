import type { Employee } from "@/types";
import type { EmployeeFormValues, EmployeeViewModel } from "@/modules/employees/types";

function pickString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function getEmployeeDisplayName(employee: Employee): string {
  const firstName = pickString(employee.firstName);
  const lastName = pickString(employee.lastName);
  const explicitName = pickString(employee.name);

  if (firstName || lastName) {
    return `${firstName ?? ""} ${lastName ?? ""}`.trim();
  }
  if (explicitName) return explicitName;
  return "Unknown Employee";
}

export function toEmployeeViewModel(employee: Employee): EmployeeViewModel {
  const position = pickString(employee.position);
  const salaryRaw = employee.salary;
  const salary = typeof salaryRaw === "number" ? salaryRaw : Number(salaryRaw);

  return {
    ...employee,
    displayName: getEmployeeDisplayName(employee),
    firstName: pickString(employee.firstName),
    lastName: pickString(employee.lastName),
    position,
    salary: Number.isNaN(salary) ? undefined : salary,
  };
}

export function toEmployeeFormValues(employee: Employee): EmployeeFormValues {
  const view = toEmployeeViewModel(employee);
  const [fallbackFirst = "", ...rest] = view.displayName.split(" ");
  const fallbackLast = rest.join(" ");

  return {
    firstName: view.firstName ?? fallbackFirst,
    lastName: view.lastName ?? fallbackLast,
    email: pickString(view.email) ?? "",
    phone: pickString(view.phone) ?? "",
    position: view.position ?? "",
    department: pickString(view.department) ?? "",
    salary: view.salary !== undefined ? String(view.salary) : "",
    status: view.status === "inactive" ? "inactive" : "active",
  };
}

export function toEmployeePayload(values: EmployeeFormValues) {
  const trimmedFirst = values.firstName.trim();
  const trimmedLast = values.lastName.trim();
  const salary = values.salary.trim() ? Number(values.salary) : undefined;

  return {
    firstName: trimmedFirst,
    lastName: trimmedLast,
    name: `${trimmedFirst} ${trimmedLast}`.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || undefined,
    position: values.position.trim(),
    department: values.department.trim(),
    salary: salary === undefined || Number.isNaN(salary) ? undefined : salary,
    status: values.status,
  };
}
