import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type { Tenant } from '@/types';

const { updateStatus } = vi.hoisted(() => ({ updateStatus: vi.fn() }));
vi.mock('@/modules/platform/services/platformTenantService', () => ({
  getPlatformTenantByKey: vi.fn(), getPlatformTenants: vi.fn(), updatePlatformTenantStatus: updateStatus,
}));

import { usePlatformTenantStatusMutation } from '@/hooks/queries/usePlatformQueries';

describe('usePlatformTenantStatusMutation', () => {
  beforeEach(() => updateStatus.mockReset());

  it('updates cached tenant data and invalidates every platform surface', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    const current: Tenant = { id: '1', tenantKey: 'acme', companyName: 'Acme', status: 'active' };
    const updated: Tenant = { ...current, status: 'suspended', active: false };
    client.setQueryData(queryKeys.platformTenants(), [current]);
    client.setQueryData(queryKeys.platformTenantDetail('acme'), current);
    updateStatus.mockResolvedValue(updated);
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => usePlatformTenantStatusMutation(), { wrapper });

    await act(async () => { await result.current.mutateAsync({ tenantKey: 'acme', status: 'SUSPENDED' }); });

    expect(client.getQueryData<Tenant>(queryKeys.platformTenantDetail('acme'))?.status).toBe('suspended');
    expect(client.getQueryData<Tenant[]>(queryKeys.platformTenants())?.[0].status).toBe('suspended');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.platformTenants() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.platformTenantDetail('acme') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.platformDashboard() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.platformAnalytics() });
  });
});
