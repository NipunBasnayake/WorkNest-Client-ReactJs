import { useQuery } from "@tanstack/react-query";
import { getTenantAnalyticsData, getTenantDashboardSnapshot } from "@/modules/analytics/services/analyticsService";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { useAuthStore } from "@/store/authStore";

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeRealtime } from '@/services/realtime/stompService';
import { useAnalyticsFilterStore } from '@/store/analyticsFilterStore';

function useBiRealtime(tenantKey: string | null) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!tenantKey) return;
    const topics = ['tasks', 'attendance', 'leave', 'recruitment', 'notifications'].map((topic) => `/topic/tenant/${tenantKey}/${topic}`);
    return subscribeRealtime(topics, () => {
      window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.tenantDashboard() });
        void queryClient.invalidateQueries({ queryKey: queryKeys.tenantAnalytics() });
      }, 250);
    });
  }, [queryClient, tenantKey]);
}

export function useTenantDashboardQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  const tenantKey = useAuthStore((s) => s.tenantKey);
  useBiRealtime(tenantKey);
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
  const filters = useAnalyticsFilterStore((s) => s.filters);
  useBiRealtime(tenantKey);
  return useQuery({
    queryKey: [...queryKeys.tenantAnalytics(), filters],
    queryFn: () => getTenantAnalyticsData(filters),
    enabled: enabled && authReady && isAuthenticated && sessionType === "tenant" && Boolean(tenantKey),
    staleTime: 30_000,
  });
}
