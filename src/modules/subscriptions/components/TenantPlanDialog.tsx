import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { Input } from "@/components/common/Input";
import { SubscriptionDialogShell } from "@/modules/subscriptions/components/SubscriptionDialogShell";
import type {
  SubscriptionPlan,
  TenantPlanAssignmentInput,
  TenantSubscription,
} from "@/modules/subscriptions/types";

interface TenantPlanDialogProps {
  open: boolean;
  subscription: TenantSubscription | null;
  plans: SubscriptionPlan[];
  saving: boolean;
  onClose: () => void;
  onSave: (input: TenantPlanAssignmentInput) => Promise<void>;
}

export function TenantPlanDialog({
  open,
  subscription,
  plans,
  saving,
  onClose,
  onSave,
}: TenantPlanDialogProps) {
  const [planCode, setPlanCode] = useState(subscription?.planCode ?? "");
  const [expiresAt, setExpiresAt] = useState(
    toLocalDateTimeInput(subscription?.expiresAt),
  );

  const availablePlans = useMemo(
    () => plans.filter((plan) => plan.active),
    [plans],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!planCode) return;
    await onSave({
      planCode,
      expiresAt: expiresAt || null,
    });
  };

  return (
    <SubscriptionDialogShell
      open={open}
      title={`Manage ${subscription?.tenantName ?? "tenant"} subscription`}
      description="Assign, upgrade, or downgrade the tenant without a payment transaction."
      onClose={onClose}
      busy={saving}
      footer={(
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="tenant-plan-form" loading={saving}>Apply plan</Button>
        </>
      )}
    >
      <form id="tenant-plan-form" className="space-y-4" onSubmit={submit}>
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Tenant</p>
          <p className="mt-1 font-semibold" style={{ color: "var(--text-primary)" }}>{subscription?.tenantName}</p>
          <p className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{subscription?.tenantKey}</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="tenant-plan" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Subscription plan
          </label>
          <AppSelect
            id="tenant-plan"
            value={planCode}
            onChange={(event) => setPlanCode(event.target.value)}
            required
          >
            {availablePlans.map((plan) => (
              <option key={plan.id} value={plan.code}>{plan.name} ({plan.code})</option>
            ))}
          </AppSelect>
        </div>
        <Input
          id="tenant-plan-expiry"
          label="Expiry date and time"
          type="datetime-local"
          value={expiresAt}
          min={toLocalDateTimeInput(new Date().toISOString())}
          onChange={(event) => setExpiresAt(event.target.value)}
          hint="Leave empty for unlimited duration."
        />
      </form>
    </SubscriptionDialogShell>
  );
}

function toLocalDateTimeInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
