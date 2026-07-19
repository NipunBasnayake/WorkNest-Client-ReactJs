import axios from "axios";
import { apiClient, buildTenantApiUrl } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList } from "@/services/http/parsers";
import type { ApiResponse } from "@/types";
import type { ImageUploadRequestOptions } from "@/services/uploads/uploadTypes";

export type EmployeeApiRole = "TENANT_ADMIN" | "ADMIN" | "MANAGER" | "HR" | "EMPLOYEE";
export type EmployeeApiStatus = "ACTIVE" | "INACTIVE";

interface EmployeeBaseRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: EmployeeApiRole;
  designation: string;
  department?: string;
  phone?: string;
  salary?: number;
  joinedDate: string;
  status: EmployeeApiStatus;
}

export interface EmployeeCreateRequest extends EmployeeBaseRequest {
  employeeCode: string;
}

export interface EmployeeUpdateRequest extends EmployeeBaseRequest {
  employeeCode?: string;
}

export interface EmployeeProfileUpdateRequest {
  firstName: string;
  lastName: string;
  designation: string;
  phone?: string;
  avatarUrl?: string;
  password?: string;
}

export interface EmployeeSkillApiPayload {
  skillName: string;
  skillLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
}

export interface ProvisionEmployeeAccountApiPayload {
  temporaryPassword: string;
}

export interface EmployeeAvatarApiResponse {
  employeeId: number;
  assetId?: string | null;
  avatarUrl?: string | null;
  variants?: Record<string, string>;
  updatedAt?: string | null;
}

export interface EmployeeListQuery {
  role?: EmployeeApiRole;
  status?: EmployeeApiStatus;
  search?: string;
  page?: number;
  size?: number;
}

export async function tenantAccessCheckApi(): Promise<boolean> {
  try {
    await apiClient.get(buildTenantApiUrl("/access-check"));
    return true;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      return false;
    }
    throw error;
  }
}

export async function createEmployeeApi(payload: EmployeeCreateRequest): Promise<unknown> {
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(
    buildTenantApiUrl("/employees"),
    payload
  );
  return unwrapApiData<unknown>(data);
}

export async function getEmployeesApi(query: EmployeeListQuery = {}): Promise<unknown[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(
    buildTenantApiUrl("/employees"),
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
    buildTenantApiUrl(`/employees/${id}`)
  );
  return unwrapApiData<unknown>(data);
}

export async function getMyEmployeeProfileApi(): Promise<unknown> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(
    buildTenantApiUrl("/employees/me")
  );
  return unwrapApiData<unknown>(data);
}

export async function updateEmployeeApi(id: string, payload: EmployeeUpdateRequest): Promise<unknown> {
  const { data } = await apiClient.put<ApiResponse<unknown> | unknown>(
    buildTenantApiUrl(`/employees/${id}`),
    payload
  );
  return unwrapApiData<unknown>(data);
}

export async function updateMyEmployeeProfileApi(payload: EmployeeProfileUpdateRequest): Promise<unknown> {
  const { data } = await apiClient.put<ApiResponse<unknown> | unknown>(
    buildTenantApiUrl("/employees/me"),
    payload
  );
  return unwrapApiData<unknown>(data);
}

export async function uploadMyEmployeeAvatarApi(
  file: File,
  options: ImageUploadRequestOptions = {},
): Promise<EmployeeAvatarApiResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.put<ApiResponse<EmployeeAvatarApiResponse> | EmployeeAvatarApiResponse>(
    buildTenantApiUrl("/employees/me/avatar"),
    formData,
    {
      signal: options.signal,
      onUploadProgress: (event) => {
        if (event.total) options.onProgress?.(Math.min(100, Math.round((event.loaded * 100) / event.total)));
      },
    },
  );
  return unwrapApiData<EmployeeAvatarApiResponse>(data);
}

export async function deleteMyEmployeeAvatarApi(): Promise<EmployeeAvatarApiResponse> {
  const { data } = await apiClient.delete<ApiResponse<EmployeeAvatarApiResponse> | EmployeeAvatarApiResponse>(
    buildTenantApiUrl("/employees/me/avatar")
  );
  return unwrapApiData<EmployeeAvatarApiResponse>(data);
}

export async function uploadEmployeeAvatarApi(
  id: string,
  file: File,
  options: ImageUploadRequestOptions = {},
): Promise<EmployeeAvatarApiResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.put<ApiResponse<EmployeeAvatarApiResponse> | EmployeeAvatarApiResponse>(
    buildTenantApiUrl(`/employees/${id}/avatar`),
    formData,
    {
      signal: options.signal,
      onUploadProgress: (event) => {
        if (event.total) options.onProgress?.(Math.min(100, Math.round((event.loaded * 100) / event.total)));
      },
    },
  );
  return unwrapApiData<EmployeeAvatarApiResponse>(data);
}

export async function deleteEmployeeAvatarApi(id: string): Promise<EmployeeAvatarApiResponse> {
  const { data } = await apiClient.delete<ApiResponse<EmployeeAvatarApiResponse> | EmployeeAvatarApiResponse>(
    buildTenantApiUrl(`/employees/${id}/avatar`)
  );
  return unwrapApiData<EmployeeAvatarApiResponse>(data);
}

export async function updateEmployeeStatusApi(id: string, status: "ACTIVE" | "INACTIVE"): Promise<void> {
  await apiClient.patch(buildTenantApiUrl(`/employees/${id}/status`), { status });
}

export async function getEmployeeSkillsApi(employeeId: string): Promise<unknown[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(
    buildTenantApiUrl(`/employees/${employeeId}/skills`)
  );
  return extractList(unwrapApiData<unknown>(data));
}

export async function getMyEmployeeSkillsApi(): Promise<unknown[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(
    buildTenantApiUrl("/employees/me/skills")
  );
  return extractList(unwrapApiData<unknown>(data));
}

export async function addEmployeeSkillApi(employeeId: string, payload: EmployeeSkillApiPayload): Promise<unknown> {
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(
    buildTenantApiUrl(`/employees/${employeeId}/skills`),
    payload
  );
  return unwrapApiData<unknown>(data);
}

export async function updateEmployeeSkillApi(
  employeeId: string,
  skillId: string,
  payload: EmployeeSkillApiPayload
): Promise<unknown> {
  const { data } = await apiClient.put<ApiResponse<unknown> | unknown>(
    buildTenantApiUrl(`/employees/${employeeId}/skills/${skillId}`),
    payload
  );
  return unwrapApiData<unknown>(data);
}

export async function deleteEmployeeSkillApi(employeeId: string, skillId: string): Promise<void> {
  await apiClient.delete(buildTenantApiUrl(`/employees/${employeeId}/skills/${skillId}`));
}

export async function provisionEmployeeAccountApi(
  employeeId: string,
  payload: ProvisionEmployeeAccountApiPayload
): Promise<unknown> {
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(
    buildTenantApiUrl(`/employees/${employeeId}/provision-account`),
    payload
  );
  return unwrapApiData<unknown>(data);
}
