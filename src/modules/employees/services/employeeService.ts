import {
  createEmployeeApi,
  getEmployeeByIdApi,
  getEmployeesApi,
  updateEmployeeApi,
  updateEmployeeStatusApi,
  type EmployeeApiPayload,
} from "@/services/api/employeeApi";
import {
  asRecord,
  firstDefined,
  getId,
  getNumber,
  getString,
  toIsoDate,
} from "@/services/http/parsers";
import type { Employee } from "@/types";

function normalizeEmployee(input: unknown): Employee {
  const value = asRecord(input);
  const firstName = firstDefined(getString(value.firstName), getString(value.first_name));
  const lastName = firstDefined(getString(value.lastName), getString(value.last_name));
  const name = firstDefined(
    getString(value.name),
    getString(value.fullName),
    `${firstName ?? ""} ${lastName ?? ""}`.trim() || undefined
  ) ?? "Employee";

  const statusRaw = firstDefined(getString(value.status), getString(value.employeeStatus));
  const status = statusRaw?.toUpperCase() === "INACTIVE" ? "inactive" : "active";

  return {
    ...value,
    id: getId(firstDefined(value.id, value.employeeId, value.userId)),
    employeeCode: firstDefined(getString(value.employeeCode), getString(value.code)),
    firstName,
    lastName,
    name,
    email: firstDefined(getString(value.email), getString(value.workEmail)) ?? "",
    phone: firstDefined(getString(value.phone), getString(value.mobile)),
    position: firstDefined(getString(value.position), getString(value.designation)),
    designation: firstDefined(getString(value.designation), getString(value.position)),
    department: getString(value.department),
    role: firstDefined(getString(value.role), getString(value.userRole)),
    salary: getNumber(value.salary),
    status,
    joinedAt: toIsoDate(firstDefined(value.joinedAt, value.joinedDate, value.joinDate)),
    joinedDate: toIsoDate(firstDefined(value.joinedDate, value.joinedAt, value.joinDate)),
  };
}

function buildUpsertPayload(payload: Partial<Employee>, isCreate: boolean): EmployeeApiPayload {
  const firstName = getString(payload.firstName) ?? "";
  const lastName = getString(payload.lastName) ?? "";
  const designation = firstDefined(getString(payload.position), getString(payload.designation)) ?? "";
  const joinedDate = toIsoDate(firstDefined(payload.joinedDate, payload.joinedAt));
  const salary = getNumber(payload.salary);
  const status = getString(payload.status)?.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE";
  const password =
    getString(payload.password) ??
    (isCreate ? "ChangeMe123!" : undefined);

  const requestPayload: EmployeeApiPayload = {
    employeeCode: getString(payload.employeeCode) ?? `EMP-${Date.now().toString().slice(-5)}`,
    firstName,
    lastName,
    email: getString(payload.email) ?? "",
    role: getString(payload.role) ?? "EMPLOYEE",
    designation,
    joinedDate: joinedDate || new Date().toISOString().slice(0, 10),
    status,
  };

  if (password) requestPayload.password = password;
  if (getString(payload.phone)) requestPayload.phone = getString(payload.phone);
  if (getString(payload.department)) requestPayload.department = getString(payload.department);
  if (salary !== undefined) requestPayload.salary = salary;

  return requestPayload;
}

function sortEmployees(items: Employee[]): Employee[] {
  return items.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export async function getEmployees(): Promise<Employee[]> {
  const list = await getEmployeesApi();
  return sortEmployees(list.map(normalizeEmployee));
}

export async function getEmployeeById(id: string): Promise<Employee> {
  const employee = await getEmployeeByIdApi(id);
  return normalizeEmployee(employee);
}

export async function getEmployeesByDepartment(department: string): Promise<Employee[]> {
  const all = await getEmployees();
  const target = department.trim().toLowerCase();
  return all.filter((item) => (item.department ?? "").toLowerCase() === target);
}

export async function createEmployee(payload: Partial<Employee>): Promise<Employee> {
  const created = await createEmployeeApi(buildUpsertPayload(payload, true));
  return normalizeEmployee(created);
}

export async function updateEmployee(id: string, payload: Partial<Employee>): Promise<Employee> {
  const updated = await updateEmployeeApi(id, buildUpsertPayload(payload, false));
  return normalizeEmployee(updated);
}

export async function deleteEmployee(id: string): Promise<void> {
  await updateEmployeeStatusApi(id, "INACTIVE");
}
