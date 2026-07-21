import { apiClient, publicClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import type {
  ApiResponse,
  Tenant,
  TenantOnboardingRequest,
  TenantProvisioningData,
  PlatformTenantStatus,
} from "@/types";
import type {
  PlatformAuditEvent,
  PlatformOperationsSnapshot,
  PlatformTenantAdminActionResult,
  PlatformUserRecord,
} from "@/modules/platform/types";
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

export async function onboardTenantApi(payload: TenantOnboardingRequest): Promise<TenantProvisioningData> {
  const { data } = await apiClient.post<
    ApiResponse<TenantProvisioningData> | TenantProvisioningData
  >("/api/platform/onboarding/tenants", payload);

  return unwrapApiData<TenantProvisioningData>(data);
}

export async function registerTenantPublicApi(
  payload: TenantOnboardingRequest
): Promise<TenantProvisioningData> {
  const idempotencyKey = crypto.randomUUID();
  const { data } = await publicClient.post<
    ApiResponse<TenantProvisioningData> | TenantProvisioningData
  >("/api/platform/onboarding/tenants", payload, {
    headers: { "Idempotency-Key": idempotencyKey },
  });

  return unwrapApiData<TenantProvisioningData>(data);
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

export async function updateTenantStatusApi(tenantKey: string, status: PlatformTenantStatus): Promise<Tenant> {
  const { data } = await apiClient.patch<ApiResponse<Tenant> | Tenant>(
    `/api/platform/tenants/${encodeURIComponent(tenantKey)}/status`,
    { status }
  );
  return unwrapApiData<Tenant>(data);
}

export async function updateTenantCompanyApi(tenantKey: string, companyName: string): Promise<Tenant> {
  const { data } = await apiClient.put<ApiResponse<Tenant> | Tenant>(
    `/api/platform/tenants/${encodeURIComponent(tenantKey)}`,
    { companyName }
  );
  return unwrapApiData<Tenant>(data);
}

export async function getPlatformOperationsSnapshotApi(): Promise<PlatformOperationsSnapshot> {
  const { data } = await apiClient.get<ApiResponse<PlatformOperationsSnapshot> | PlatformOperationsSnapshot>(
    "/api/platform/operations/snapshot"
  );
  return unwrapApiData<PlatformOperationsSnapshot>(data);
}

export async function getPlatformUsersApi(): Promise<PlatformUserRecord[]> {
  const { data } = await apiClient.get<ApiResponse<PlatformUserRecord[]> | PlatformUserRecord[]>(
    "/api/platform/operations/users"
  );
  return unwrapApiData<PlatformUserRecord[]>(data);
}

export async function getPlatformAuditEventsApi(): Promise<PlatformAuditEvent[]> {
  const { data } = await apiClient.get<ApiResponse<PlatformAuditEvent[]> | PlatformAuditEvent[]>(
    "/api/platform/operations/audit-events"
  );
  return unwrapApiData<PlatformAuditEvent[]>(data);
}

export async function resetTenantAdminPasswordApi(tenantKey: string): Promise<PlatformTenantAdminActionResult> {
  const { data } = await apiClient.post<ApiResponse<PlatformTenantAdminActionResult> | PlatformTenantAdminActionResult>(
    `/api/platform/tenants/${encodeURIComponent(tenantKey)}/admin/reset-password`
  );
  return unwrapApiData<PlatformTenantAdminActionResult>(data);
}

export async function unlockTenantAdminApi(tenantKey: string): Promise<PlatformTenantAdminActionResult> {
  const { data } = await apiClient.post<ApiResponse<PlatformTenantAdminActionResult> | PlatformTenantAdminActionResult>(
    `/api/platform/tenants/${encodeURIComponent(tenantKey)}/admin/unlock`
  );
  return unwrapApiData<PlatformTenantAdminActionResult>(data);
}

export async function resendTenantWelcomeApi(tenantKey: string): Promise<PlatformTenantAdminActionResult> {
  const { data } = await apiClient.post<ApiResponse<PlatformTenantAdminActionResult> | PlatformTenantAdminActionResult>(
    `/api/platform/tenants/${encodeURIComponent(tenantKey)}/admin/resend-welcome`
  );
  return unwrapApiData<PlatformTenantAdminActionResult>(data);
}
