import { apiClient, buildTenantApiUrl, publicClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import type { ApiResponse } from "@/types";
import type { BrandingUpdateInput, TenantBranding } from "@/features/branding/types";
import type { ImageUploadRequestOptions } from "@/services/uploads/uploadTypes";

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

export async function uploadTenantLogo(
  file: File,
  brandingVersion: number,
  options: ImageUploadRequestOptions = {},
): Promise<TenantBranding> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.put<ApiResponse<TenantBranding> | TenantBranding>(
    buildTenantApiUrl("/settings/branding/logo"),
    formData,
    {
      headers: { "If-Match": `"brand-${brandingVersion}"` },
      signal: options.signal,
      onUploadProgress: (event) => {
        if (event.total) options.onProgress?.(Math.min(100, Math.round((event.loaded * 100) / event.total)));
      },
    }
  );
  return unwrapApiData<TenantBranding>(data);
}

export async function deleteTenantLogo(brandingVersion: number): Promise<TenantBranding> {
  const { data } = await apiClient.delete<ApiResponse<TenantBranding> | TenantBranding>(
    buildTenantApiUrl("/settings/branding/logo"),
    { headers: { "If-Match": `"brand-${brandingVersion}"` } }
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

export async function uploadPlatformTenantLogo(
  tenantKey: string,
  file: File,
  brandingVersion: number,
  options: ImageUploadRequestOptions = {},
): Promise<TenantBranding> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.put<ApiResponse<TenantBranding> | TenantBranding>(
    `/api/platform/tenants/${encodeURIComponent(tenantKey)}/branding/logo`,
    formData,
    {
      headers: { "If-Match": `"brand-${brandingVersion}"` },
      signal: options.signal,
      onUploadProgress: (event) => {
        if (event.total) options.onProgress?.(Math.min(100, Math.round((event.loaded * 100) / event.total)));
      },
    }
  );
  return unwrapApiData<TenantBranding>(data);
}

export async function deletePlatformTenantLogo(
  tenantKey: string,
  brandingVersion: number
): Promise<TenantBranding> {
  const { data } = await apiClient.delete<ApiResponse<TenantBranding> | TenantBranding>(
    `/api/platform/tenants/${encodeURIComponent(tenantKey)}/branding/logo`,
    { headers: { "If-Match": `"brand-${brandingVersion}"` } }
  );
  return unwrapApiData<TenantBranding>(data);
}
