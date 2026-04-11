import { useQuery } from "@tanstack/react-query";
import { getPlatformAnalyticsData } from "@/modules/analytics/services/analyticsService";
import { getPlatformTenantByKey, getPlatformTenants } from "@/modules/platform/services/platformTenantService";
import { queryKeys } from "@/hooks/queries/queryKeys";

export function usePlatformAnalyticsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.platformAnalytics(),
    queryFn: getPlatformAnalyticsData,
    enabled,
    staleTime: 60_000,
  });
}

export function usePlatformTenantsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.platformTenants(),
    queryFn: getPlatformTenants,
    enabled,
    staleTime: 60_000,
  });
}

export function usePlatformTenantDetailQuery(tenantKey: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.platformTenantDetail(tenantKey),
    queryFn: () => {
      if (!tenantKey) {
        throw new Error("Tenant key is required.");
      }
      return getPlatformTenantByKey(tenantKey);
    },
    enabled: enabled && Boolean(tenantKey),
    staleTime: 60_000,
  });
}
