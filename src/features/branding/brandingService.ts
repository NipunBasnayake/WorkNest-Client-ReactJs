import { apiClient, buildTenantApiUrl, publicClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import type { ApiResponse } from "@/types";
import type { BrandingUpdateInput, TenantBranding } from "@/features/branding/types";

export async function getPublicBranding(tenantSlug: string): Promise<TenantBranding> {
  const { data } = await publicClient.get<ApiResponse<TenantBranding> | TenantBranding>(
    `/api/public/${encodeURIComponent(tenantSlug)}/branding`
  );
  return unwrapApiData<TenantBranding>(data);
}

export async function getTenantBranding(): Promise<TenantBranding> {
  const { data } = await apiClient.get<ApiResponse<TenantBranding> | TenantBranding>(
    buildTenantApiUrl("/branding")
  );
  return unwrapApiData<TenantBranding>(data);
}

export async function getEditableTenantBranding(): Promise<TenantBranding> {
  const { data } = await apiClient.get<ApiResponse<TenantBranding> | TenantBranding>(
    buildTenantApiUrl("/settings/branding")
  );
  return unwrapApiData<TenantBranding>(data);
}

export async function updateTenantBranding(input: BrandingUpdateInput): Promise<TenantBranding> {
  const { data } = await apiClient.patch<ApiResponse<TenantBranding> | TenantBranding>(
    buildTenantApiUrl("/settings/branding"),
    input,
    { headers: { "If-Match": `"brand-${input.brandingVersion}"` } }
  );
  return unwrapApiData<TenantBranding>(data);
}

export async function getPlatformTenantBranding(tenantKey: string): Promise<TenantBranding> {
  const { data } = await apiClient.get<ApiResponse<TenantBranding> | TenantBranding>(
    `/api/platform/tenants/${encodeURIComponent(tenantKey)}/branding`
  );
  return unwrapApiData<TenantBranding>(data);
}

export async function updatePlatformTenantBranding(
  tenantKey: string,
  input: BrandingUpdateInput
): Promise<TenantBranding> {
  const { data } = await apiClient.patch<ApiResponse<TenantBranding> | TenantBranding>(
    `/api/platform/tenants/${encodeURIComponent(tenantKey)}/branding`,
    input,
    { headers: { "If-Match": `"brand-${input.brandingVersion}"` } }
  );
  return unwrapApiData<TenantBranding>(data);
}
