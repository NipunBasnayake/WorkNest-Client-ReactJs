import { useQuery } from "@tanstack/react-query";
import { getPlatformAnalyticsData } from "@/modules/analytics/services/analyticsService";
import { getPlatformTenantByKey, getPlatformTenants } from "@/modules/platform/services/platformTenantService";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { useAuthStore } from "@/store/authStore";

export function usePlatformAnalyticsQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  return useQuery({
    queryKey: queryKeys.platformAnalytics(),
    queryFn: getPlatformAnalyticsData,
    enabled: enabled && authReady && isAuthenticated && sessionType === "platform",
    staleTime: 60_000,
  });
}

export function usePlatformTenantsQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  return useQuery({
    queryKey: queryKeys.platformTenants(),
    queryFn: getPlatformTenants,
    enabled: enabled && authReady && isAuthenticated && sessionType === "platform",
    staleTime: 60_000,
  });
}

export function usePlatformTenantDetailQuery(tenantKey: string | undefined, enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  return useQuery({
    queryKey: queryKeys.platformTenantDetail(tenantKey),
    queryFn: () => {
      if (!tenantKey) {
        throw new Error("Tenant key is required.");
      }
      return getPlatformTenantByKey(tenantKey);
    },
    enabled: enabled && authReady && isAuthenticated && sessionType === "platform" && Boolean(tenantKey),
    staleTime: 60_000,
  });
}
