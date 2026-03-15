import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import type { ApiResponse, Employee } from "@/types";

type EmployeeListPayload = Employee[] | { employees: Employee[] };

function toEmployeeList(payload: EmployeeListPayload): Employee[] {
  if (Array.isArray(payload)) return payload;
  return payload.employees ?? [];
}

export async function tenantAccessCheckApi(): Promise<boolean> {
  try {
    await apiClient.get("/api/tenant/access-check");
    return true;
  } catch {
    return false;
  }
}

export async function getTenantInfoApi(): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get<
    ApiResponse<Record<string, unknown>> | Record<string, unknown>
  >("/api/tenant/employees/tenant-info");

  return unwrapApiData<Record<string, unknown>>(data);
}

export async function employeeHealthApi(): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get<
    ApiResponse<Record<string, unknown>> | Record<string, unknown>
  >("/api/tenant/employees/health");

  return unwrapApiData<Record<string, unknown>>(data);
}

export async function createEmployeeApi(payload: Partial<Employee>): Promise<Employee> {
  const { data } = await apiClient.post<ApiResponse<Employee> | Employee>(
    "/api/tenant/employees",
    payload
  );

  return unwrapApiData<Employee>(data);
}

export async function getEmployeesApi(): Promise<Employee[]> {
  const { data } = await apiClient.get<ApiResponse<EmployeeListPayload> | EmployeeListPayload>(
    "/api/tenant/employees"
  );

  return toEmployeeList(unwrapApiData<EmployeeListPayload>(data));
}

export async function getEmployeeByIdApi(id: string): Promise<Employee> {
  const { data } = await apiClient.get<ApiResponse<Employee> | Employee>(
    `/api/tenant/employees/${id}`
  );

  return unwrapApiData<Employee>(data);
}

export async function updateEmployeeApi(id: string, payload: Partial<Employee>): Promise<Employee> {
  const { data } = await apiClient.put<ApiResponse<Employee> | Employee>(
    `/api/tenant/employees/${id}`,
    payload
  );

  return unwrapApiData<Employee>(data);
}

export async function getEmployeesByDeptApi(department: string): Promise<Employee[]> {
  const { data } = await apiClient.get<ApiResponse<EmployeeListPayload> | EmployeeListPayload>(
    `/api/tenant/employees/department/${department}`
  );

  return toEmployeeList(unwrapApiData<EmployeeListPayload>(data));
}

export async function deleteEmployeeApi(id: string): Promise<void> {
  await apiClient.delete(`/api/tenant/employees/${id}`);
}
