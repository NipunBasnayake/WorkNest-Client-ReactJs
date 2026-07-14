import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, patch, put } = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), put: vi.fn() }));

vi.mock('@/services/http/client', () => ({
  apiClient: { get, post: vi.fn(), patch, put },
  publicClient: { post: vi.fn() },
}));

import { getPlatformOperationsSnapshotApi, updateTenantCompanyApi, updateTenantStatusApi } from '@/services/api/platformApi';

describe('updateTenantStatusApi', () => {
  beforeEach(() => { get.mockReset(); patch.mockReset(); put.mockReset(); });

  it('uses the secured PATCH status endpoint with an uppercase enum payload', async () => {
    patch.mockResolvedValue({ data: { success: true, data: { tenantKey: 'acme/org', status: 'SUSPENDED' } } });

    const result = await updateTenantStatusApi('acme/org', 'SUSPENDED');

    expect(patch).toHaveBeenCalledWith('/api/platform/tenants/acme%2Forg/status', { status: 'SUSPENDED' });
    expect(result.status).toBe('SUSPENDED');
  });

  it('loads the secured server-side operations snapshot', async () => {
    get.mockResolvedValue({ data: { success: true, data: { tenants: { total: 12 }, users: { total: 80 } } } });
    const result = await getPlatformOperationsSnapshotApi();
    expect(get).toHaveBeenCalledWith('/api/platform/operations/snapshot');
    expect(result.tenants.total).toBe(12);
  });

  it('updates company information without changing tenant identity', async () => {
    put.mockResolvedValue({ data: { success: true, data: { tenantKey: 'acme', companyName: 'Acme Group' } } });
    const result = await updateTenantCompanyApi('acme', 'Acme Group');
    expect(put).toHaveBeenCalledWith('/api/platform/tenants/acme', { companyName: 'Acme Group' });
    expect(result.companyName).toBe('Acme Group');
  });
});
