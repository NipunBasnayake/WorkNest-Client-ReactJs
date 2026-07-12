import { beforeEach, describe, expect, it, vi } from 'vitest';

const { patch } = vi.hoisted(() => ({ patch: vi.fn() }));

vi.mock('@/services/http/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch },
  publicClient: { post: vi.fn() },
}));

import { updateTenantStatusApi } from '@/services/api/platformApi';

describe('updateTenantStatusApi', () => {
  beforeEach(() => patch.mockReset());

  it('uses the secured PATCH status endpoint with an uppercase enum payload', async () => {
    patch.mockResolvedValue({ data: { success: true, data: { tenantKey: 'acme/org', status: 'SUSPENDED' } } });

    const result = await updateTenantStatusApi('acme/org', 'SUSPENDED');

    expect(patch).toHaveBeenCalledWith('/api/platform/tenants/acme%2Forg/status', { status: 'SUSPENDED' });
    expect(result.status).toBe('SUSPENDED');
  });
});
