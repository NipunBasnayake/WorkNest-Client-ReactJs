import { useMemo, useState } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePlatformTenantStatusMutation } from '@/hooks/queries/usePlatformQueries';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/errorHandler';
import type { PlatformTenantStatus, Tenant } from '@/types';

const statuses: PlatformTenantStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const actionMessage: Record<PlatformTenantStatus, string> = {
  ACTIVE: 'Tenant activated successfully.',
  INACTIVE: 'Tenant marked inactive successfully.',
  SUSPENDED: 'Tenant suspended successfully.',
};

interface Props { tenant: Tenant; open: boolean; onClose: () => void }

export function TenantStatusDialog({ tenant, open, onClose }: Props) {
  const currentStatus = String(tenant.status ?? 'ACTIVE').toUpperCase() as PlatformTenantStatus;
  const [selectedStatus, setSelectedStatus] = useState<PlatformTenantStatus>(currentStatus);
  const [confirming, setConfirming] = useState(false);
  const mutation = usePlatformTenantStatusMutation();
  const toast = useToast();

  const needsConfirmation = (currentStatus === 'ACTIVE' && selectedStatus === 'SUSPENDED') ||
    (currentStatus === 'SUSPENDED' && selectedStatus === 'ACTIVE');
  const confirmation = useMemo(() => selectedStatus === 'SUSPENDED'
    ? { title: 'Suspend this tenant?', description: 'Users will immediately lose access to this workspace until it is reactivated.', label: 'Suspend tenant' }
    : { title: 'Reactivate this tenant?', description: 'Workspace access will be restored immediately for active tenant users.', label: 'Reactivate tenant' }, [selectedStatus]);

  async function saveStatus() {
    try {
      await mutation.mutateAsync({ tenantKey: tenant.tenantKey, status: selectedStatus });
      toast.success({ title: actionMessage[selectedStatus] });
      setConfirming(false);
      onClose();
    } catch (error) {
      setConfirming(false);
      toast.error({ title: 'Tenant status was not updated', description: getErrorMessage(error, 'Please try again.') });
    }
  }

  if (!open) return null;
  return <>
    <div className='fixed inset-0 z-40 flex items-center justify-center p-4'>
      <button aria-label='Close status editor' className='absolute inset-0 bg-black/55 backdrop-blur-sm' onClick={onClose} disabled={mutation.isPending} />
      <section role='dialog' aria-modal='true' aria-labelledby='tenant-status-title' className='relative z-10 w-full max-w-lg rounded-2xl border p-6 shadow-2xl' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        <div className='flex items-start gap-3'><span className='rounded-xl bg-purple-500/10 p-2.5 text-purple-600'><Activity size={20} /></span><div><h2 id='tenant-status-title' className='text-lg font-bold' style={{ color: 'var(--text-primary)' }}>Change tenant status</h2><p className='mt-1 text-sm' style={{ color: 'var(--text-secondary)' }}>{tenant.companyName} · {tenant.tenantKey}</p></div></div>
        <label className='mt-6 block'><span className='mb-2 block text-sm font-semibold' style={{ color: 'var(--text-primary)' }}>Status</span><select aria-label='Tenant status' value={selectedStatus} disabled={mutation.isPending} onChange={(event) => setSelectedStatus(event.target.value as PlatformTenantStatus)} className='h-11 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/30' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}>{statuses.map((status) => <option key={status} value={status}>{status[0] + status.slice(1).toLowerCase()}</option>)}</select></label>
        {selectedStatus !== 'ACTIVE' && <div className='mt-4 flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300'><ShieldAlert size={16} className='shrink-0' /><span>{selectedStatus === 'SUSPENDED' ? 'Suspension blocks workspace access.' : 'Inactive tenants cannot access tenant APIs until reactivated.'}</span></div>}
        <div className='mt-6 flex justify-end gap-2'><Button variant='ghost' onClick={onClose} disabled={mutation.isPending}>Cancel</Button><Button onClick={() => needsConfirmation ? setConfirming(true) : void saveStatus()} loading={mutation.isPending} disabled={selectedStatus === currentStatus}>Save status</Button></div>
      </section>
    </div>
    <ConfirmDialog open={confirming} title={confirmation.title} description={confirmation.description} confirmLabel={confirmation.label} loading={mutation.isPending} onCancel={() => setConfirming(false)} onConfirm={() => void saveStatus()} />
  </>;
}
