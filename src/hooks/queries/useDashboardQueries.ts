import { useQuery } from "@tanstack/react-query";
import { getTenantAnalyticsData, getTenantDashboardSnapshot } from "@/modules/analytics/services/analyticsService";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { useAuthStore } from "@/store/authStore";

export function useTenantDashboardQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  const tenantKey = useAuthStore((s) => s.tenantKey);
  return useQuery({
    queryKey: queryKeys.tenantDashboard(),
    queryFn: getTenantDashboardSnapshot,
    enabled: enabled && authReady && isAuthenticated && sessionType === "tenant" && Boolean(tenantKey),
    staleTime: 30_000,
    refetchInterval: 45_000,
  });
}

export function useTenantAnalyticsQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  const tenantKey = useAuthStore((s) => s.tenantKey);
  return useQuery({
    queryKey: queryKeys.tenantAnalytics(),
    queryFn: getTenantAnalyticsData,
    enabled: enabled && authReady && isAuthenticated && sessionType === "tenant" && Boolean(tenantKey),
    staleTime: 30_000,
  });
}
