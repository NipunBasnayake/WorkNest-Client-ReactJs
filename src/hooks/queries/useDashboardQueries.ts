import { useQuery } from "@tanstack/react-query";
import { getTenantAnalyticsData, getTenantDashboardSnapshot } from "@/modules/analytics/services/analyticsService";
import { queryKeys } from "@/hooks/queries/queryKeys";

export function useTenantDashboardQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.tenantDashboard(),
    queryFn: getTenantDashboardSnapshot,
    enabled,
    staleTime: 30_000,
    refetchInterval: 45_000,
  });
}

export function useTenantAnalyticsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.tenantAnalytics(),
    queryFn: getTenantAnalyticsData,
    enabled,
    staleTime: 30_000,
  });
}
