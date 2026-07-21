import {
  createEmployeeApi,
  getEmployeeByIdApi,
  getEmployeeSkillsApi,
  getMyEmployeeSkillsApi,
  getSkillSuggestionsApi,
  getEmployeesApi,
  getMyEmployeeProfileApi,
  provisionEmployeeAccountApi,
  updateEmployeeApi,
  updateEmployeeStatusApi,
  type EmployeeApiRole,
  type EmployeeApiStatus,
  type EmployeeCreateRequest,
  type EmployeeUpdateRequest,
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
import type { EmployeeSkill, EmployeeSkillPayload, SkillSuggestion } from "@/modules/employees/types";
import { normalizeSkillName } from "@/modules/employees/utils/employeeSkills";

type EmployeeUpsertPayload = Partial<Employee> & {
  password?: string;
  skills?: EmployeeSkillPayload[];
};

function toApiRole(role: unknown): EmployeeApiRole {
  const value = getString(role)?.toUpperCase();
  if (value === "TENANT_ADMIN" || value === "ADMIN" || value === "MANAGER" || value === "HR" || value === "EMPLOYEE") {
    return value as EmployeeApiRole;
  }
  return "EMPLOYEE";
}

function toApiStatus(status: unknown): EmployeeApiStatus {
  return getString(status)?.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE";
}

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
    avatarUrl: firstDefined(getString(value.avatarUrl), getString(value.profileImageUrl), getString(value.imageUrl)),
  };
}

function normalizeSkill(input: unknown): EmployeeSkill {
  const value = asRecord(input);
  const name = firstDefined(getString(value.name), getString(value.skillName)) ?? "Skill";

  return {
    id: getId(firstDefined(value.id, value.skillId)),
    name,
  };
}

function buildUpsertPayload(payload: EmployeeUpsertPayload, isCreate: true): EmployeeCreateRequest;
function buildUpsertPayload(payload: EmployeeUpsertPayload, isCreate: false): EmployeeUpdateRequest;
function buildUpsertPayload(payload: EmployeeUpsertPayload, isCreate: boolean): EmployeeCreateRequest | EmployeeUpdateRequest {
  const firstName = getString(payload.firstName) ?? "";
  const lastName = getString(payload.lastName) ?? "";
  const designation = firstDefined(getString(payload.position), getString(payload.designation)) ?? "";
  const joinedDate = toIsoDate(firstDefined(payload.joinedDate, payload.joinedAt));
  const salary = getNumber(payload.salary);
  const status = toApiStatus(payload.status);
  const password = getString(payload.password);

  const basePayload: EmployeeUpdateRequest = {
    firstName,
    lastName,
    email: getString(payload.email) ?? "",
    role: toApiRole(payload.role),
    designation,
    joinedDate,
    status,
    skills: payload.skills?.map((skill) => ({
      skillName: normalizeSkillName(skill.name),
    })),
  };

  if (password) basePayload.password = password;
  if (getString(payload.department)) basePayload.department = getString(payload.department);
  if (getString(payload.phone)) basePayload.phone = getString(payload.phone);
  if (salary !== undefined) basePayload.salary = salary;

  if (isCreate) {
    return {
      employeeCode: getString(payload.employeeCode) ?? `EMP-${Date.now().toString().slice(-5)}`,
      ...basePayload,
    };
  }

  return basePayload;
}

function sortEmployees(items: Employee[]): Employee[] {
  return items.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export async function getEmployees(): Promise<Employee[]> {
  const list = await getEmployeesApi();
  return sortEmployees(list.map(normalizeEmployee));
}

export async function searchEmployees(search: string): Promise<Employee[]> {
  const normalizedSearch = search.trim();
  const list = await getEmployeesApi(normalizedSearch ? { search: normalizedSearch } : {});
  return sortEmployees(list.map(normalizeEmployee));
}

export async function getEmployeeById(id: string): Promise<Employee> {
  const employee = await getEmployeeByIdApi(id);
  return normalizeEmployee(employee);
}

export async function getMyEmployeeProfile(): Promise<Employee> {
  const employee = await getMyEmployeeProfileApi();
  return normalizeEmployee(employee);
}

export async function getEmployeesByDepartment(department: string): Promise<Employee[]> {
  const all = await getEmployees();
  const target = department.trim().toLowerCase();
  return all.filter((item) => (item.department ?? "").toLowerCase() === target);
}

export async function createEmployee(payload: EmployeeUpsertPayload): Promise<Employee> {
  const created = await createEmployeeApi(buildUpsertPayload(payload, true));
  return normalizeEmployee(created);
}

export async function updateEmployee(id: string, payload: EmployeeUpsertPayload): Promise<Employee> {
  const updated = await updateEmployeeApi(id, buildUpsertPayload(payload, false));
  return normalizeEmployee(updated);
}

export async function updateEmployeeStatus(id: string, status: "active" | "inactive"): Promise<void> {
  await updateEmployeeStatusApi(id, status === "inactive" ? "INACTIVE" : "ACTIVE");
}

export async function deleteEmployee(id: string): Promise<void> {
  await updateEmployeeStatus(id, "inactive");
}

export async function getEmployeeSkills(employeeId: string): Promise<EmployeeSkill[]> {
  const list = await getEmployeeSkillsApi(employeeId);
  return list.map(normalizeSkill).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getMyEmployeeSkills(): Promise<EmployeeSkill[]> {
  const list = await getMyEmployeeSkillsApi();
  return list.map(normalizeSkill).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSkillSuggestions(search = ""): Promise<SkillSuggestion[]> {
  const values = await getSkillSuggestionsApi(search);
  return values
    .map((value) => {
      const record = asRecord(value);
      return {
        name: firstDefined(getString(record.name), getString(record.skillName)) ?? "",
      };
    })
    .filter((skill) => Boolean(skill.name))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function provisionEmployeeAccount(employeeId: string, temporaryPassword: string): Promise<void> {
  await provisionEmployeeAccountApi(employeeId, { temporaryPassword });
}
