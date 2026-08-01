import { useState, type FormEvent } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Switch } from "@/components/common/Switch";
import { SubscriptionDialogShell } from "@/modules/subscriptions/components/SubscriptionDialogShell";
import type { SubscriptionPlan, SubscriptionPlanInput } from "@/modules/subscriptions/types";

interface PlanEditorDialogProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: SubscriptionPlanInput) => Promise<void>;
}

const emptyForm: SubscriptionPlanInput = {
  name: "",
  code: "",
  description: "",
  monthlyPrice: 0,
  yearlyPrice: 0,
  billingPeriod: "MONTHLY",
  badge: "",
  recommended: false,
  color: "#2563eb",
  icon: "package",
  active: true,
  displayOrder: 50,
};

export function PlanEditorDialog({
  open,
  plan,
  saving,
  onClose,
  onSave,
}: PlanEditorDialogProps) {
  const [form, setForm] = useState<SubscriptionPlanInput>(() => plan ? {
    name: plan.name,
    code: plan.code,
    description: plan.description ?? "",
    monthlyPrice: plan.monthlyPrice ?? 0,
    yearlyPrice: plan.yearlyPrice ?? 0,
    billingPeriod: plan.billingPeriod ?? "MONTHLY",
    badge: plan.badge ?? "",
    recommended: plan.recommended,
    color: plan.color ?? "#2563eb",
    icon: plan.icon ?? "package",
    active: plan.active,
    displayOrder: plan.displayOrder,
  } : emptyForm);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      setError("Plan name and code are required.");
      return;
    }
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(form.code.trim())) {
      setError("Plan code must begin with a letter and contain only letters, numbers, hyphens, or underscores.");
      return;
    }
    setError(null);
    await onSave({
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description?.trim(),
      monthlyPrice: Number(form.monthlyPrice),
      yearlyPrice: Number(form.yearlyPrice),
      billingPeriod: form.billingPeriod,
      badge: form.badge?.trim(),
      recommended: form.recommended,
      color: form.color.trim(),
      icon: form.icon.trim(),
      displayOrder: Number(form.displayOrder),
    });
  };

  const isFree = plan?.code === "FREE";

  return (
    <SubscriptionDialogShell
      open={open}
      title={plan ? "Edit subscription plan" : "Create subscription plan"}
      description={plan ? "Update plan details and availability." : "Add a reusable plan to the WorkNest catalogue."}
      onClose={onClose}
      busy={saving}
      footer={(
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="subscription-plan-form" loading={saving}>
            {plan ? "Save changes" : "Create plan"}
          </Button>
        </>
      )}
    >
      <form id="subscription-plan-form" className="space-y-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="plan-name"
            label="Plan name"
            value={form.name}
            maxLength={100}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Growth"
            required
          />
          <Input
            id="plan-code"
            label="Plan code"
            value={form.code}
            maxLength={50}
            disabled={isFree}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
            placeholder="GROWTH"
            hint={isFree ? "FREE is reserved for automatic assignment." : "Stable identifier used by future billing integrations."}
            required
          />
        </div>
        <div>
          <label htmlFor="plan-description" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Description
          </label>
          <textarea
            id="plan-description"
            rows={4}
            maxLength={1000}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/35"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
            placeholder="Describe who this plan is designed for."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <Input
            id="plan-monthly-price"
            label="Monthly price"
            type="number"
            min={0}
            step="0.01"
            value={form.monthlyPrice}
            onChange={(event) => setForm((current) => ({ ...current, monthlyPrice: Number(event.target.value) }))}
            required
          />
          <Input
            id="plan-yearly-price"
            label="Yearly price"
            type="number"
            min={0}
            step="0.01"
            value={form.yearlyPrice}
            onChange={(event) => setForm((current) => ({ ...current, yearlyPrice: Number(event.target.value) }))}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="plan-billing-period"
            label="Billing period"
            value={form.billingPeriod}
            maxLength={30}
            onChange={(event) => setForm((current) => ({ ...current, billingPeriod: event.target.value.toUpperCase() }))}
            placeholder="MONTHLY"
            required
          />
          <Input
            id="plan-badge"
            label="Badge"
            value={form.badge}
            maxLength={60}
            onChange={(event) => setForm((current) => ({ ...current, badge: event.target.value }))}
            placeholder="Recommended"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            id="plan-color"
            label="Color"
            value={form.color}
            maxLength={30}
            onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
            placeholder="#2563eb"
            required
          />
          <Input
            id="plan-icon"
            label="Icon"
            value={form.icon}
            maxLength={60}
            onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
            placeholder="rocket"
            required
          />
          <Input
            id="plan-order"
            label="Display order"
            type="number"
            min={0}
            max={10000}
            value={form.displayOrder}
            onChange={(event) => setForm((current) => ({ ...current, displayOrder: Number(event.target.value) }))}
            hint="Lower values appear first."
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
            <Switch
              label="Available for assignment"
              checked={form.active}
              disabled={isFree}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
            />
          </div>
          <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
            <Switch
              label="Recommended package"
              checked={form.recommended}
              onChange={(event) => setForm((current) => ({ ...current, recommended: event.target.checked }))}
            />
          </div>
        </div>
        {error ? <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p> : null}
      </form>
    </SubscriptionDialogShell>
  );
}
