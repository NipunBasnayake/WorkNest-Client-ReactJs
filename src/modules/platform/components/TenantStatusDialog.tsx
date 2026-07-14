import { useMemo, useState } from "react";
import { Activity, Archive, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { usePlatformTenantStatusMutation } from "@/hooks/queries/usePlatformQueries";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/utils/errorHandler";
import type { PlatformTenantStatus, Tenant } from "@/types";

const statusMeta: Record<PlatformTenantStatus, { label: string; description: string }> = {
  PROVISIONING: { label: "Pending setup", description: "Provisioning is controlled by the onboarding workflow." },
  ACTIVE: { label: "Active", description: "Restore full workspace access for this company." },
  INACTIVE: { label: "Deactivated", description: "Disable workspace access without treating the company as a security risk." },
  SUSPENDED: { label: "Suspended", description: "Immediately block workspace access until an administrator restores it." },
  ARCHIVED: { label: "Archived", description: "Soft-delete the tenant while preserving its platform and database records." },
  REJECTED: { label: "Rejected", description: "Reject a tenant that is still in the onboarding process." },
};

const actionMessage: Record<PlatformTenantStatus, string> = {
  PROVISIONING: "Tenant returned to pending setup.",
  ACTIVE: "Tenant access restored successfully.",
  INACTIVE: "Tenant deactivated successfully.",
  SUSPENDED: "Tenant suspended successfully.",
  ARCHIVED: "Tenant archived successfully.",
  REJECTED: "Tenant registration rejected.",
};

const actionVerb: Record<PlatformTenantStatus, string> = {
  PROVISIONING: "Return to pending setup",
  ACTIVE: "Activate",
  INACTIVE: "Deactivate",
  SUSPENDED: "Suspend",
  ARCHIVED: "Archive",
  REJECTED: "Reject",
};

interface Props {
  tenant: Tenant;
  open: boolean;
  onClose: () => void;
  initialStatus?: PlatformTenantStatus;
}

function availableStatuses(current: PlatformTenantStatus): PlatformTenantStatus[] {
  if (current === "PROVISIONING") return ["ACTIVE", "REJECTED"];
  if (current === "ARCHIVED" || current === "REJECTED") return ["ACTIVE"];
  return ["ACTIVE", "INACTIVE", "SUSPENDED", "ARCHIVED"].filter((status) => status !== current) as PlatformTenantStatus[];
}

export function TenantStatusDialog({ tenant, open, onClose, initialStatus }: Props) {
  const currentStatus = String(tenant.status ?? "ACTIVE").toUpperCase() as PlatformTenantStatus;
  const choices = useMemo(() => availableStatuses(currentStatus), [currentStatus]);
  const [selectedStatus, setSelectedStatus] = useState<PlatformTenantStatus>(initialStatus ?? choices[0] ?? currentStatus);
  const [confirming, setConfirming] = useState(false);
  const mutation = usePlatformTenantStatusMutation();
  const toast = useToast();

  const confirmation = useMemo(() => ({
    title: `${actionVerb[selectedStatus]} ${tenant.companyName}?`,
    description: `${statusMeta[selectedStatus].description} This lifecycle change is recorded in the platform audit log.`,
    label: `${actionVerb[selectedStatus]} tenant`,
  }), [selectedStatus, tenant.companyName]);

  async function saveStatus() {
    try {
      await mutation.mutateAsync({ tenantKey: tenant.tenantKey, status: selectedStatus });
      toast.success({ title: actionMessage[selectedStatus] });
      setConfirming(false);
      onClose();
    } catch (error) {
      setConfirming(false);
      toast.error({ title: "Tenant lifecycle was not updated", description: getErrorMessage(error, "Please try again.") });
    }
  }

  if (!open) return null;
  const SelectedIcon = selectedStatus === "ACTIVE" ? CheckCircle2 : selectedStatus === "ARCHIVED" ? Archive : ShieldAlert;

  return <>
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button aria-label="Close lifecycle editor" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} disabled={mutation.isPending} />
      <section role="dialog" aria-modal="true" aria-labelledby="tenant-status-title" className="relative z-10 w-full max-w-lg rounded-2xl border p-6 shadow-2xl" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-purple-500/10 p-2.5 text-purple-600"><Activity size={20} /></span>
          <div>
            <h2 id="tenant-status-title" className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Manage tenant lifecycle</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{tenant.companyName} · {tenant.tenantKey}</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
          <span style={{ color: "var(--text-tertiary)" }}>Current status</span>
          <strong className="ml-2" style={{ color: "var(--text-primary)" }}>{statusMeta[currentStatus]?.label ?? currentStatus}</strong>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Change to</span>
          <select aria-label="Tenant status" value={selectedStatus} disabled={mutation.isPending} onChange={(event) => setSelectedStatus(event.target.value as PlatformTenantStatus)} className="h-11 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-purple-500/30" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}>
            {choices.map((status) => <option key={status} value={status}>{statusMeta[status].label}</option>)}
          </select>
        </label>

        <div className="mt-4 flex gap-2 rounded-xl border p-3 text-xs" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)", color: "var(--text-secondary)" }}>
          <SelectedIcon size={16} className="shrink-0 text-purple-600" />
          <span>{statusMeta[selectedStatus].description}</span>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button onClick={() => setConfirming(true)} loading={mutation.isPending}>Review change</Button>
        </div>
      </section>
    </div>
    <ConfirmDialog open={confirming} title={confirmation.title} description={confirmation.description} confirmLabel={confirmation.label} loading={mutation.isPending} onCancel={() => setConfirming(false)} onConfirm={() => void saveStatus()} />
  </>;
}
