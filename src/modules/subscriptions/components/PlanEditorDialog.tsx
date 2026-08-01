import { useMemo, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BriefcaseBusiness,
  Check,
  CreditCard,
  MessageSquare,
  PackageCheck,
  Palette,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Checkbox } from "@/components/common/Checkbox";
import { Input } from "@/components/common/Input";
import { Switch } from "@/components/common/Switch";
import { SubscriptionDialogShell } from "@/modules/subscriptions/components/SubscriptionDialogShell";
import type { FeatureMatrixRow, SubscriptionPlan, SubscriptionPlanInput } from "@/modules/subscriptions/types";

type EditorTab = "general" | "pricing" | "features" | "appearance" | "advanced";
type FeatureCategory = "Overview" | "People" | "Work" | "Communication" | "Analytics" | "Administration" | "Future";

interface PlanEditorDialogProps {
  open: boolean;
  plan: SubscriptionPlan | null;
  features?: FeatureMatrixRow[];
  saving: boolean;
  onClose: () => void;
  onSave: (input: SubscriptionPlanInput, selectedFeatureKeys?: string[]) => Promise<void>;
}

type EditorForm = SubscriptionPlanInput & {
  trialDays: number;
  futurePaymentProvider: string;
};

const tabs: Array<{ id: EditorTab; label: string; icon: ReactNode }> = [
  { id: "general", label: "General", icon: <PackageCheck size={15} /> },
  { id: "pricing", label: "Pricing", icon: <CreditCard size={15} /> },
  { id: "features", label: "Features", icon: <Check size={15} /> },
  { id: "appearance", label: "Appearance", icon: <Palette size={15} /> },
  { id: "advanced", label: "Advanced", icon: <Settings size={15} /> },
];

const emptyForm: EditorForm = {
  name: "",
  code: "",
  description: "",
  monthlyPrice: 0,
  yearlyPrice: 0,
  billingPeriod: "MONTHLY",
  badge: "",
  recommended: false,
  color: "var(--brand-action)",
  icon: "package",
  active: true,
  displayOrder: 50,
  trialDays: 0,
  futurePaymentProvider: "Not connected",
};

const featureCategoryMap: Record<string, FeatureCategory> = {
  DASHBOARD: "Overview",
  EMPLOYEE: "People",
  TEAMS: "People",
  ATTENDANCE: "People",
  LEAVE: "People",
  PAYROLL: "People",
  PROJECTS: "Work",
  TASKS: "Work",
  RECRUITMENT: "Work",
  CHAT: "Communication",
  NOTIFICATIONS: "Communication",
  ANNOUNCEMENTS: "Communication",
  REPORTS: "Analytics",
  ANALYTICS: "Analytics",
  AUDIT: "Administration",
  SETTINGS: "Administration",
  DOCUMENTS: "Administration",
  ASSETS: "Future",
  CALENDAR: "Future",
};

const categoryIcons: Record<FeatureCategory, ReactNode> = {
  Overview: <Sparkles size={16} />,
  People: <Users size={16} />,
  Work: <BriefcaseBusiness size={16} />,
  Communication: <MessageSquare size={16} />,
  Analytics: <BarChart3 size={16} />,
  Administration: <ShieldCheck size={16} />,
  Future: <PackageCheck size={16} />,
};

export function PlanEditorDialog({
  open,
  plan,
  features = [],
  saving,
  onClose,
  onSave,
}: PlanEditorDialogProps) {
  const [form, setForm] = useState<EditorForm>(() => plan ? {
    name: plan.name,
    code: plan.code,
    description: plan.description ?? "",
    monthlyPrice: plan.monthlyPrice ?? 0,
    yearlyPrice: plan.yearlyPrice ?? 0,
    billingPeriod: plan.billingPeriod ?? "MONTHLY",
    badge: plan.badge ?? "",
    recommended: plan.recommended,
    color: plan.color ?? "var(--brand-action)",
    icon: plan.icon ?? "package",
    active: plan.active,
    displayOrder: plan.displayOrder,
    trialDays: 0,
    futurePaymentProvider: "Not connected",
  } : emptyForm);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(() => new Set(
    features
      .filter((feature) => plan ? feature.plans[plan.code] : true)
      .map((feature) => feature.featureKey),
  ));
  const [tab, setTab] = useState<EditorTab>("general");
  const [featureSearch, setFeatureSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const groupedFeatures = useMemo(() => groupFeatures(features, featureSearch), [featureSearch, features]);
  const isFree = plan?.code === "FREE";
  const accent = normalizeAccent(form.color);

  const validate = () => {
    if (!form.name.trim() || !form.code.trim()) return "Package name and code are required.";
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(form.code.trim())) {
      return "Package code must begin with a letter and contain only letters, numbers, hyphens, or underscores.";
    }
    return null;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setTab("general");
      setError(validation);
      return;
    }
    setError(null);
    await onSave({
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description?.trim(),
      monthlyPrice: Number(form.monthlyPrice),
      yearlyPrice: Number(form.yearlyPrice),
      billingPeriod: form.billingPeriod.trim().toUpperCase(),
      badge: form.badge?.trim(),
      recommended: form.recommended,
      color: form.color.trim(),
      icon: form.icon.trim(),
      active: form.active,
      displayOrder: Number(form.displayOrder),
    }, [...selectedFeatures]);
  };

  return (
    <SubscriptionDialogShell
      open={open}
      title={plan ? "Edit package" : "Create package"}
      description="Manage package details, pricing, appearance, and feature access from one controlled editor."
      onClose={onClose}
      busy={saving}
      size="lg"
      footer={(
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="subscription-plan-form" loading={saving}>
            {plan ? "Save package" : "Create package"}
          </Button>
        </>
      )}
    >
      <form id="subscription-plan-form" className="space-y-5" onSubmit={submit}>
        <div className="overflow-x-auto">
          <div className="inline-flex min-w-full gap-1 rounded-xl border p-1 sm:min-w-0" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:flex-none"
                style={{
                  background: tab === item.id ? "var(--bg-surface)" : "transparent",
                  color: tab === item.id ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: tab === item.id ? "var(--shadow-sm)" : "none",
                }}
              >
                <span style={{ color: tab === item.id ? accent : "var(--text-tertiary)" }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {tab === "general" ? <GeneralTab form={form} isFree={isFree} setForm={setForm} /> : null}
            {tab === "pricing" ? <PricingTab form={form} setForm={setForm} /> : null}
            {tab === "features" ? (
              <FeaturesTab
                groupedFeatures={groupedFeatures}
                selectedFeatures={selectedFeatures}
                search={featureSearch}
                accent={accent}
                onSearch={setFeatureSearch}
                onSelectedFeatures={setSelectedFeatures}
              />
            ) : null}
            {tab === "appearance" ? <AppearanceTab form={form} accent={accent} setForm={setForm} /> : null}
            {tab === "advanced" ? <AdvancedTab form={form} isFree={isFree} setForm={setForm} /> : null}
          </motion.div>
        </AnimatePresence>

        {error ? <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p> : null}
      </form>
    </SubscriptionDialogShell>
  );
}

function GeneralTab({
  form,
  isFree,
  setForm,
}: {
  form: EditorForm;
  isFree: boolean;
  setForm: Dispatch<SetStateAction<EditorForm>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="plan-name" label="Package name" value={form.name} maxLength={100} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Professional" required />
        <Input id="plan-code" label="Package code" value={form.code} maxLength={50} disabled={isFree} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="PROFESSIONAL" hint={isFree ? "FREE is reserved for automatic assignment." : "Stable identifier used by future billing integrations."} required />
      </div>
      <div>
        <label htmlFor="plan-description" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Description</label>
        <textarea id="plan-description" rows={5} maxLength={1000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/35" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }} placeholder="Advanced capabilities for growing teams." />
      </div>
    </div>
  );
}

function PricingTab({ form, setForm }: { form: EditorForm; setForm: Dispatch<SetStateAction<EditorForm>> }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="plan-monthly-price" label="Monthly price" type="number" min={0} step="0.01" value={form.monthlyPrice} onChange={(event) => setForm((current) => ({ ...current, monthlyPrice: Number(event.target.value) }))} required />
        <Input id="plan-yearly-price" label="Yearly price" type="number" min={0} step="0.01" value={form.yearlyPrice} onChange={(event) => setForm((current) => ({ ...current, yearlyPrice: Number(event.target.value) }))} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input id="plan-billing-period" label="Billing period" value={form.billingPeriod} maxLength={30} onChange={(event) => setForm((current) => ({ ...current, billingPeriod: event.target.value.toUpperCase() }))} placeholder="MONTHLY" required />
        <Input id="plan-trial-days" label="Trial days" type="number" min={0} value={form.trialDays} onChange={(event) => setForm((current) => ({ ...current, trialDays: Number(event.target.value) }))} hint="Stored when billing is connected." />
        <Input id="plan-payment-provider" label="Future payment provider" value={form.futurePaymentProvider} onChange={(event) => setForm((current) => ({ ...current, futurePaymentProvider: event.target.value }))} placeholder="Stripe, PayHere, PayPal" />
      </div>
      <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)", color: "var(--text-secondary)" }}>
        Tenant pages render these configured monthly and yearly prices even while billing is disabled.
      </div>
    </div>
  );
}

function FeaturesTab({
  groupedFeatures,
  selectedFeatures,
  search,
  accent,
  onSearch,
  onSelectedFeatures,
}: {
  groupedFeatures: Partial<Record<FeatureCategory, FeatureMatrixRow[]>>;
  selectedFeatures: Set<string>;
  search: string;
  accent: string;
  onSearch: (value: string) => void;
  onSelectedFeatures: Dispatch<SetStateAction<Set<string>>>;
}) {
  const toggleFeature = (featureKey: string) => {
    onSelectedFeatures((current) => {
      const next = new Set(current);
      if (next.has(featureKey)) next.delete(featureKey);
      else next.add(featureKey);
      return next;
    });
  };

  const setCategory = (features: FeatureMatrixRow[], enabled: boolean) => {
    onSelectedFeatures((current) => {
      const next = new Set(current);
      features.forEach((feature) => {
        if (enabled) next.add(feature.featureKey);
        else next.delete(feature.featureKey);
      });
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "var(--text-tertiary)" }} />
        <Input id="feature-search" label="Search features" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search by feature name or key" className="pl-9" />
      </div>
      <div className="space-y-4">
        {Object.entries(groupedFeatures).map(([category, features]) => {
          const enabledCount = features.filter((feature) => selectedFeatures.has(feature.featureKey)).length;
          return (
            <section key={category} className="rounded-xl border p-4" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: tint(accent, 8), color: accent }}>{categoryIcons[category as FeatureCategory]}</span>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{category}</h3>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{enabledCount}/{features.length} selected</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => setCategory(features, true)}>Select all</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setCategory(features, false)}>Clear</Button>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {features.map((feature) => {
                  const enabled = selectedFeatures.has(feature.featureKey);
                  return (
                    <label key={feature.featureId} className="flex min-h-[62px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors" style={{ borderColor: enabled ? accent : "var(--border-default)", background: enabled ? tint(accent, 6) : "var(--bg-surface)" }}>
                      <Checkbox checked={enabled} onChange={() => toggleFeature(feature.featureKey)} aria-label={feature.displayName} />
                      <span>
                        <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{feature.displayName}</span>
                        <span className="font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>{feature.featureKey}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function AppearanceTab({
  form,
  accent,
  setForm,
}: {
  form: EditorForm;
  accent: string;
  setForm: Dispatch<SetStateAction<EditorForm>>;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input id="plan-color" label="Accent color" value={form.color} maxLength={40} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} placeholder="var(--brand-action)" required />
          <Input id="plan-icon" label="Icon" value={form.icon} maxLength={60} onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))} placeholder="package" required />
          <Input id="plan-badge" label="Badge" value={form.badge} maxLength={60} onChange={(event) => setForm((current) => ({ ...current, badge: event.target.value }))} placeholder="Recommended" />
        </div>
        <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
          <Switch label="Recommended package" checked={form.recommended} onChange={(event) => setForm((current) => ({ ...current, recommended: event.target.checked }))} />
        </div>
      </div>
      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)" }}>
        <span className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: tint(accent, 9), color: accent }}><PackageCheck size={22} /></span>
        <h3 className="mt-4 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{form.name || "Package name"}</h3>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{form.description || "Package preview"}</p>
        {form.recommended ? <span className="mt-4 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: tint(accent, 9), color: accent }}>{form.badge || "Recommended"}</span> : null}
      </div>
    </div>
  );
}

function AdvancedTab({
  form,
  isFree,
  setForm,
}: {
  form: EditorForm;
  isFree: boolean;
  setForm: Dispatch<SetStateAction<EditorForm>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="plan-order" label="Display order" type="number" min={0} max={10000} value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: Number(event.target.value) }))} hint="Lower values appear first." required />
        <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
          <Switch label="Visible and active" checked={form.active} disabled={isFree} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
        </div>
      </div>
      <div className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)", color: "var(--text-secondary)" }}>
        Active packages are visible to tenant admins. Disabling a package hides it from new selections while preserving existing tenant assignments.
      </div>
    </div>
  );
}

function groupFeatures(features: FeatureMatrixRow[], search: string): Partial<Record<FeatureCategory, FeatureMatrixRow[]>> {
  const query = search.trim().toLowerCase();
  return features
    .filter((feature) => !query || `${feature.displayName} ${feature.featureKey}`.toLowerCase().includes(query))
    .reduce<Partial<Record<FeatureCategory, FeatureMatrixRow[]>>>((groups, feature) => {
      const category = featureCategoryMap[feature.featureKey] ?? "Future";
      groups[category] = [...(groups[category] ?? []), feature];
      return groups;
    }, {});
}

function normalizeAccent(value: string): string {
  return value.trim() || "var(--brand-action)";
}

function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
