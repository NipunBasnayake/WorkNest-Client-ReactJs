import { apiClient, publicClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import type { ApiResponse, Tenant } from "@/types";
import { extractList } from "@/services/http/parsers";

type TenantListPayload = Tenant[] | { tenants: Tenant[] };

export async function platformAccessCheckApi(): Promise<boolean> {
  try {
    await apiClient.get("/api/platform/access-check");
    return true;
  } catch {
    return false;
  }
}

export async function onboardTenantApi(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await apiClient.post<
    ApiResponse<Record<string, unknown>> | Record<string, unknown>
  >("/api/platform/onboarding/tenants", payload);

  return unwrapApiData<Record<string, unknown>>(data);
}

export async function registerTenantPublicApi(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await publicClient.post<
    ApiResponse<Record<string, unknown>> | Record<string, unknown>
  >("/api/platform/onboarding/tenants", payload);

  return unwrapApiData<Record<string, unknown>>(data);
}

export async function getTenantsApi(): Promise<Tenant[]> {
  const { data } = await apiClient.get<ApiResponse<TenantListPayload> | TenantListPayload>(
    "/api/platform/tenants"
  );

  const parsed = unwrapApiData<TenantListPayload>(data);
  if (Array.isArray(parsed)) return parsed;
  if (parsed.tenants) return parsed.tenants;
  return extractList<Tenant>(parsed);
}

export async function getTenantByKeyApi(tenantKey: string): Promise<Tenant> {
  const { data } = await apiClient.get<ApiResponse<Tenant> | Tenant>(
    `/api/platform/tenants/${tenantKey}`
  );

  return unwrapApiData<Tenant>(data);
}
