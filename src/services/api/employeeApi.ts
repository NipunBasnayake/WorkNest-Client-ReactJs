import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList } from "@/services/http/parsers";
import type { ApiResponse } from "@/types";

export interface EmployeeApiPayload {
  employeeCode?: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role?: string;
  designation?: string;
  joinedDate?: string;
  status?: string;
  phone?: string;
  department?: string;
  salary?: number;
}

export interface EmployeeListQuery {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}

export async function tenantAccessCheckApi(): Promise<boolean> {
  try {
    await apiClient.get("/api/tenant/access-check");
    return true;
  } catch {
    return false;
  }
}

export async function createEmployeeApi(payload: EmployeeApiPayload): Promise<unknown> {
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(
    "/api/tenant/employees",
    payload
  );
  return unwrapApiData<unknown>(data);
}

export async function getEmployeesApi(query: EmployeeListQuery = {}): Promise<unknown[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(
    "/api/tenant/employees",
    { params: query }
  );
  const parsed = unwrapApiData<unknown>(data);
  if (Array.isArray(parsed)) return parsed;
  if (asRecord(parsed).content && Array.isArray(asRecord(parsed).content)) {
    return asRecord(parsed).content as unknown[];
  }
  return extractList(parsed);
}

export async function getEmployeeByIdApi(id: string): Promise<unknown> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(
    `/api/tenant/employees/${id}`
  );
  return unwrapApiData<unknown>(data);
}

export async function getMyEmployeeProfileApi(): Promise<unknown> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(
    "/api/tenant/employees/me"
  );
  return unwrapApiData<unknown>(data);
}

export async function updateEmployeeApi(id: string, payload: EmployeeApiPayload): Promise<unknown> {
  const { data } = await apiClient.put<ApiResponse<unknown> | unknown>(
    `/api/tenant/employees/${id}`,
    payload
  );
  return unwrapApiData<unknown>(data);
}

export async function updateMyEmployeeProfileApi(payload: EmployeeApiPayload): Promise<unknown> {
  const { data } = await apiClient.put<ApiResponse<unknown> | unknown>(
    "/api/tenant/employees/me",
    payload
  );
  return unwrapApiData<unknown>(data);
}

export async function updateEmployeeStatusApi(id: string, status: "ACTIVE" | "INACTIVE"): Promise<void> {
  await apiClient.patch(`/api/tenant/employees/${id}/status`, { status });
}

export async function getEmployeeSkillsApi(employeeId: string): Promise<unknown[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(
    `/api/tenant/employees/${employeeId}/skills`
  );
  return extractList(unwrapApiData<unknown>(data));
}
