import { useQuery, type QueryClient } from "@tanstack/react-query";
import { getBusinessIntelligenceReport, getTenantAnalyticsData, getTenantDashboardSnapshot } from "@/modules/analytics/services/analyticsService";
import { useDeferredValue } from 'react';
import { queryKeys } from "@/hooks/queries/queryKeys";
import { useAuthStore } from "@/store/authStore";

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeRealtime } from '@/services/realtime/stompService';
import { useAnalyticsFilterStore } from '@/store/analyticsFilterStore';

interface BiRealtimeSubscription {
  referenceCount: number;
  invalidateTimer: number | null;
  unsubscribe: () => void;
}

const biRealtimeSubscriptions = new WeakMap<QueryClient, Map<string, BiRealtimeSubscription>>();

function useBiRealtime(tenantKey: string | null) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!tenantKey) return;

    let clientSubscriptions = biRealtimeSubscriptions.get(queryClient);
    if (!clientSubscriptions) {
      clientSubscriptions = new Map();
      biRealtimeSubscriptions.set(queryClient, clientSubscriptions);
    }

    let subscription = clientSubscriptions.get(tenantKey);
    if (!subscription) {
      const topics = ['tasks', 'employees', 'attendance', 'leave', 'recruitment', 'announcements', 'notifications']
        .map((topic) => `/topic/tenant/${tenantKey}/${topic}`);
      subscription = {
        referenceCount: 0,
        invalidateTimer: null,
        unsubscribe: () => {},
      };
      const activeSubscription = subscription;
      activeSubscription.unsubscribe = subscribeRealtime(topics, () => {
        if (activeSubscription.invalidateTimer !== null) {
          window.clearTimeout(activeSubscription.invalidateTimer);
        }
        activeSubscription.invalidateTimer = window.setTimeout(() => {
          activeSubscription.invalidateTimer = null;
          void queryClient.invalidateQueries({ queryKey: queryKeys.tenantDashboard() });
          void queryClient.invalidateQueries({ queryKey: queryKeys.tenantAnalytics() });
          void queryClient.invalidateQueries({ queryKey: queryKeys.businessIntelligence() });
        }, 250);
      });
      clientSubscriptions.set(tenantKey, activeSubscription);
    }

    subscription.referenceCount += 1;
    const activeSubscription = subscription;
    const activeClientSubscriptions = clientSubscriptions;
    return () => {
      activeSubscription.referenceCount -= 1;
      if (activeSubscription.referenceCount > 0) return;

      if (activeSubscription.invalidateTimer !== null) {
        window.clearTimeout(activeSubscription.invalidateTimer);
      }
      activeSubscription.unsubscribe();
      activeClientSubscriptions.delete(tenantKey);
      if (activeClientSubscriptions.size === 0) {
        biRealtimeSubscriptions.delete(queryClient);
      }
    };
  }, [queryClient, tenantKey]);
}

export function useTenantDashboardQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  const tenantKey = useAuthStore((s) => s.tenantKey);
  const queryEnabled = enabled && authReady && isAuthenticated && sessionType === "tenant" && Boolean(tenantKey);
  useBiRealtime(queryEnabled ? tenantKey : null);
  return useQuery({
    queryKey: queryKeys.tenantDashboard(),
    queryFn: getTenantDashboardSnapshot,
    enabled: queryEnabled,
    staleTime: 30_000,
    refetchInterval: 45_000,
  });
}

export function useTenantAnalyticsQuery(enabled = true) {
  const queryClient = useQueryClient();
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  const tenantKey = useAuthStore((s) => s.tenantKey);
  const filters = useAnalyticsFilterStore((s) => s.filters);
  const queryEnabled = enabled && authReady && isAuthenticated && sessionType === "tenant" && Boolean(tenantKey);
  useBiRealtime(queryEnabled ? tenantKey : null);
  return useQuery({
    queryKey: [...queryKeys.tenantAnalytics(), filters],
    queryFn: async () => {
      const snapshot = await queryClient.ensureQueryData({ queryKey: queryKeys.tenantDashboard(), queryFn: getTenantDashboardSnapshot, staleTime: 30_000 });
      return getTenantAnalyticsData(filters, snapshot);
    },
    enabled: queryEnabled,
    staleTime: 30_000,
  });
}

export function useBusinessIntelligenceQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  const tenantKey = useAuthStore((s) => s.tenantKey);
  const filters = useAnalyticsFilterStore((s) => s.filters);
  const deferredFilters = useDeferredValue(filters);
  const queryEnabled = enabled && authReady && isAuthenticated && sessionType === 'tenant' && Boolean(tenantKey);
  useBiRealtime(queryEnabled ? tenantKey : null);
  return useQuery({
    queryKey: [...queryKeys.businessIntelligence(), deferredFilters],
    queryFn: () => getBusinessIntelligenceReport(deferredFilters),
    enabled: queryEnabled,
    staleTime: 45_000,
  });
}
