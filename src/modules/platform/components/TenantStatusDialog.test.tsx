import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TenantStatusDialog } from '@/modules/platform/components/TenantStatusDialog';

const mutateAsync = vi.fn();
const success = vi.fn();
const error = vi.fn();

vi.mock('@/hooks/queries/usePlatformQueries', () => ({
  usePlatformTenantStatusMutation: () => ({ mutateAsync, isPending: false }),
}));
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ success, error }) }));

const tenant = { id: '1', tenantKey: 'acme', companyName: 'Acme Ltd', status: 'active' };

describe('TenantStatusDialog', () => {
  beforeEach(() => { mutateAsync.mockReset(); success.mockReset(); error.mockReset(); });

  it('confirms ACTIVE to SUSPENDED and submits the enum payload', async () => {
    mutateAsync.mockResolvedValue({ ...tenant, status: 'suspended' });
    const onClose = vi.fn();
    render(<TenantStatusDialog tenant={tenant} open onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Tenant status'), { target: { value: 'SUSPENDED' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review change' }));

    expect(screen.getByRole('dialog', { name: 'Suspend Acme Ltd?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Suspend tenant' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ tenantKey: 'acme', status: 'SUSPENDED' }));
    expect(success).toHaveBeenCalledWith({ title: 'Tenant suspended successfully.' });
    expect(onClose).toHaveBeenCalled();
  });

  it('confirms ACTIVE to INACTIVE before updating', async () => {
    mutateAsync.mockResolvedValue({ ...tenant, status: 'inactive' });
    render(<TenantStatusDialog tenant={tenant} open onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Tenant status'), { target: { value: 'INACTIVE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review change' }));
    expect(screen.getByRole('dialog', { name: 'Deactivate Acme Ltd?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate tenant' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ tenantKey: 'acme', status: 'INACTIVE' }));
  });

  it('confirms SUSPENDED to ACTIVE reactivation', async () => {
    mutateAsync.mockResolvedValue({ ...tenant, status: 'active' });
    render(<TenantStatusDialog tenant={{ ...tenant, status: 'suspended' }} open onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Tenant status'), { target: { value: 'ACTIVE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Review change' }));
    expect(screen.getByRole('dialog', { name: 'Activate Acme Ltd?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Activate tenant' }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ tenantKey: 'acme', status: 'ACTIVE' }));
  });
});
