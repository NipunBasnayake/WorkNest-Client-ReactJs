import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RealtimeListener } from "@/services/realtime/stompService";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { useAuthStore } from "@/store/authStore";

const realtime = vi.hoisted(() => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("@/services/realtime/stompService", () => ({
  subscribeRealtime: realtime.subscribe,
}));

vi.mock("@/modules/analytics/services/analyticsService", () => ({
  getTenantDashboardSnapshot: vi.fn().mockResolvedValue({}),
  getTenantAnalyticsData: vi.fn().mockResolvedValue({}),
  getBusinessIntelligenceReport: vi.fn().mockResolvedValue({}),
}));

import {
  useBusinessIntelligenceQuery,
  useTenantAnalyticsQuery,
  useTenantDashboardQuery,
} from "@/hooks/queries/useDashboardQueries";

describe("dashboard realtime queries", () => {
  const originalAuthState = useAuthStore.getState();
  let listener: RealtimeListener | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    realtime.subscribe.mockReset();
    realtime.unsubscribe.mockReset();
    listener = null;
    realtime.subscribe.mockImplementation((_topics: string[], next: RealtimeListener) => {
      listener = next;
      return realtime.unsubscribe;
    });
    useAuthStore.setState({
      authReady: true,
      isAuthenticated: true,
      sessionType: "tenant",
      tenantKey: "acme",
    });
  });

  afterEach(() => {
    useAuthStore.setState(originalAuthState, true);
    vi.useRealTimers();
  });

  it("shares one debounced subscription across mounted dashboard queries", () => {
    const client = createQueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue(undefined);
    const wrapper = createWrapper(client);
    const view = renderHook(() => {
      useTenantAnalyticsQuery();
      useTenantDashboardQuery();
      useBusinessIntelligenceQuery(false);
    }, { wrapper });

    expect(realtime.subscribe).toHaveBeenCalledTimes(1);
    expect(realtime.subscribe.mock.calls[0][0]).toHaveLength(7);

    act(() => {
      listener?.({}, {} as Parameters<RealtimeListener>[1]);
      listener?.({}, {} as Parameters<RealtimeListener>[1]);
      vi.advanceTimersByTime(250);
    });

    expect(invalidate).toHaveBeenCalledTimes(3);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.tenantDashboard() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.tenantAnalytics() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.businessIntelligence() });

    view.unmount();
    expect(realtime.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending invalidation when the final consumer unmounts", () => {
    const client = createQueryClient();
    const invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue(undefined);
    const wrapper = createWrapper(client);
    const view = renderHook(() => useTenantDashboardQuery(), { wrapper });

    act(() => {
      listener?.({}, {} as Parameters<RealtimeListener>[1]);
    });
    view.unmount();
    act(() => vi.advanceTimersByTime(250));

    expect(invalidate).not.toHaveBeenCalled();
    expect(realtime.unsubscribe).toHaveBeenCalledTimes(1);
  });
});

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function createWrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
