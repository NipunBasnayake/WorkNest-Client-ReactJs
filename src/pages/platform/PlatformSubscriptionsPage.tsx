import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CreditCard,
  Edit3,
  Eye,
  Layers3,
  Plus,
  Power,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/AsyncStates";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchField } from "@/components/common/SearchField";
import { SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/AppUI";
import { Switch } from "@/components/common/Switch";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useToast } from "@/hooks/useToast";
import {
  useAssignTenantPlanMutation,
  useCreateSubscriptionPlanMutation,
  useDeactivateTenantSubscriptionMutation,
  useSetPlanFeatureMutation,
  useSetSubscriptionPlanActiveMutation,
  useSubscriptionOverviewQuery,
  useUpdateSubscriptionPlanMutation,
} from "@/hooks/queries/useSubscriptionQueries";
import { PlanEditorDialog } from "@/modules/subscriptions/components/PlanEditorDialog";
import { TenantPlanDialog } from "@/modules/subscriptions/components/TenantPlanDialog";
import type {
  SubscriptionPlan,
  SubscriptionPlanInput,
  SubscriptionStatus,
  TenantPlanAssignmentInput,
  TenantSubscription,
} from "@/modules/subscriptions/types";
import { getErrorMessage } from "@/utils/errorHandler";

type SubscriptionTab = "plans" | "tenants" | "matrix";

const tabs: Array<{ id: SubscriptionTab; label: string; icon: React.ReactNode }> = [
  { id: "plans", label: "Subscription Plans", icon: <CreditCard size={16} /> },
  { id: "tenants", label: "Tenant Subscriptions", icon: <Building2 size={16} /> },
  { id: "matrix", label: "Feature Matrix", icon: <Layers3 size={16} /> },
];

const planAccents: Record<string, string> = {
  FREE: "#64748b",
  STARTER: "#2563eb",
  PROFESSIONAL: "#9332ea",
  ENTERPRISE: "#059669",
};

export function PlatformSubscriptionsPage() {
  usePageMeta({ title: "Subscription Management", breadcrumb: ["Platform", "Subscriptions"] });
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SubscriptionTab>("plans");
  const [planEditorTarget, setPlanEditorTarget] = useState<SubscriptionPlan | null | undefined>(undefined);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [tenantDialogTarget, setTenantDialogTarget] = useState<TenantSubscription | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<TenantSubscription | null>(null);
  const [tenantSearch, setTenantSearch] = useState("");

  const overviewQuery = useSubscriptionOverviewQuery(true);
  const createPlanMutation = useCreateSubscriptionPlanMutation();
  const updatePlanMutation = useUpdateSubscriptionPlanMutation();
  const setPlanActiveMutation = useSetSubscriptionPlanActiveMutation();
  const setFeatureMutation = useSetPlanFeatureMutation();
  const assignPlanMutation = useAssignTenantPlanMutation();
  const deactivateMutation = useDeactivateTenantSubscriptionMutation();

  const data = overviewQuery.data;
  const errorMessage = overviewQuery.error
    ? getErrorMessage(overviewQuery.error, "Could not load subscription management data.")
    : null;

  const selectedPlan = data?.plans.find((plan) => plan.id === selectedPlanId)
    ?? data?.plans[0]
    ?? null;

  const filteredSubscriptions = useMemo(() => {
    const query = tenantSearch.trim().toLowerCase();
    if (!data) return [];
    return data.tenantSubscriptions.filter((subscription) =>
      !query || [
        subscription.tenantName,
        subscription.tenantKey,
        subscription.planName,
        subscription.planCode,
        subscription.status,
      ].some((value) => value.toLowerCase().includes(query)));
  }, [data, tenantSearch]);

  const savePlan = async (input: SubscriptionPlanInput) => {
    try {
      const saved = planEditorTarget
        ? await updatePlanMutation.mutateAsync({ planId: planEditorTarget.id, payload: input })
        : await createPlanMutation.mutateAsync(input);
      setSelectedPlanId(saved.id);
      setPlanEditorTarget(undefined);
      toast.success({
        title: planEditorTarget ? "Plan updated" : "Plan created",
        description: `${saved.name} is ready for subscription management.`,
      });
    } catch (error) {
      toast.error({ title: "Plan was not saved", description: getErrorMessage(error) });
    }
  };

  const setPlanActive = async (plan: SubscriptionPlan, active: boolean) => {
    try {
      await setPlanActiveMutation.mutateAsync({ planId: plan.id, active });
      toast.success({
        title: active ? "Plan enabled" : "Plan disabled",
        description: `${plan.name} ${active ? "can now" : "can no longer"} be assigned.`,
      });
    } catch (error) {
      toast.error({ title: "Plan status was not changed", description: getErrorMessage(error) });
    }
  };

  const setFeature = async (plan: SubscriptionPlan, featureKey: string, enabled: boolean) => {
    try {
      await setFeatureMutation.mutateAsync({ planId: plan.id, featureKey, enabled });
      toast.success({
        title: enabled ? "Feature enabled" : "Feature disabled",
        description: `${featureLabel(featureKey)} was updated for ${plan.name}.`,
      });
    } catch (error) {
      toast.error({ title: "Feature was not updated", description: getErrorMessage(error) });
    }
  };

  const assignPlan = async (input: TenantPlanAssignmentInput) => {
    if (!tenantDialogTarget) return;
    try {
      const previous = tenantDialogTarget.planCode;
      const updated = await assignPlanMutation.mutateAsync({
        tenantKey: tenantDialogTarget.tenantKey,
        payload: input,
      });
      setTenantDialogTarget(null);
      toast.success({
        title: previous === updated.planCode ? "Subscription renewed" : "Plan assigned",
        description: `${updated.tenantName} now uses ${updated.planName}.`,
      });
    } catch (error) {
      toast.error({ title: "Subscription was not changed", description: getErrorMessage(error) });
    }
  };

  const deactivateSubscription = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateMutation.mutateAsync(deactivateTarget.tenantKey);
      toast.success({
        title: "Subscription deactivated",
        description: `${deactivateTarget.tenantName} no longer has feature access.`,
      });
      setDeactivateTarget(null);
    } catch (error) {
      toast.error({ title: "Subscription was not deactivated", description: getErrorMessage(error) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Management"
        description="Control SaaS plans, tenant assignments, and feature access independently from payment providers."
        primaryActions={(
          <Button onClick={() => setPlanEditorTarget(null)}>
            <Plus size={16} /> Create plan
          </Button>
        )}
      />

      {errorMessage ? <ErrorState message={errorMessage} onRetry={() => void overviewQuery.refetch()} /> : null}
      {overviewQuery.isLoading ? <SectionCard><LoadingSkeleton lines={10} className="h-72" /></SectionCard> : null}

      {!overviewQuery.isLoading && !errorMessage && data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total tenants" value={data.statistics.totalTenants} icon={<Building2 size={20} />} accentColor="#9332ea" />
            {data.plans.slice(0, 4).map((plan) => (
              <StatCard
                key={plan.id}
                label={plan.name}
                value={data.statistics.planDistribution[plan.code] ?? 0}
                icon={<CreditCard size={20} />}
                accentColor={planAccents[plan.code] ?? "#7c3aed"}
              />
            ))}
            <StatCard label="Recently upgraded" value={data.statistics.recentlyUpgraded} icon={<ArrowUpRight size={20} />} accentColor="#059669" />
            <StatCard label="Recently expired" value={data.statistics.recentlyExpired} icon={<CalendarClock size={20} />} accentColor="#d97706" />
          </div>

          <div className="overflow-x-auto">
            <div className="inline-flex min-w-full gap-1 rounded-2xl border p-1.5 sm:min-w-0" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-none"
                  style={{
                    background: activeTab === tab.id ? "var(--brand-action)" : "transparent",
                    color: activeTab === tab.id ? "white" : "var(--text-secondary)",
                  }}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "plans" ? (
            <PlansSection
              plans={data.plans}
              selectedPlan={selectedPlan}
              onSelectPlan={(plan) => setSelectedPlanId(plan.id)}
              onEditPlan={(plan) => setPlanEditorTarget(plan)}
              onSetActive={(plan, active) => void setPlanActive(plan, active)}
              statusPending={setPlanActiveMutation.isPending}
            />
          ) : null}

          {activeTab === "tenants" ? (
            <TenantSubscriptionsSection
              subscriptions={filteredSubscriptions}
              plans={data.plans}
              search={tenantSearch}
              onSearch={setTenantSearch}
              onManage={setTenantDialogTarget}
              onDeactivate={setDeactivateTarget}
            />
          ) : null}

          {activeTab === "matrix" ? (
            <FeatureMatrixSection
              plans={data.featureMatrix.plans}
              features={data.featureMatrix.features}
              pending={setFeatureMutation.isPending}
              onToggle={(plan, featureKey, enabled) => void setFeature(plan, featureKey, enabled)}
            />
          ) : null}
        </>
      ) : null}

      {planEditorTarget !== undefined ? (
        <PlanEditorDialog
          key={planEditorTarget?.id ?? "new"}
          open
          plan={planEditorTarget}
          saving={createPlanMutation.isPending || updatePlanMutation.isPending}
          onClose={() => setPlanEditorTarget(undefined)}
          onSave={savePlan}
        />
      ) : null}
      {tenantDialogTarget ? (
        <TenantPlanDialog
          key={tenantDialogTarget.tenantKey}
          open
          subscription={tenantDialogTarget}
          plans={data?.plans ?? []}
          saving={assignPlanMutation.isPending}
          onClose={() => setTenantDialogTarget(null)}
          onSave={assignPlan}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="Deactivate tenant subscription?"
        description={`${deactivateTarget?.tenantName ?? "This tenant"} will immediately lose access to subscription-controlled features. You can reactivate it by assigning a plan again.`}
        confirmLabel="Deactivate"
        loading={deactivateMutation.isPending}
        onConfirm={() => void deactivateSubscription()}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}

function PlansSection({
  plans,
  selectedPlan,
  onSelectPlan,
  onEditPlan,
  onSetActive,
  statusPending,
}: {
  plans: SubscriptionPlan[];
  selectedPlan: SubscriptionPlan | null;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  onEditPlan: (plan: SubscriptionPlan) => void;
  onSetActive: (plan: SubscriptionPlan, active: boolean) => void;
  statusPending: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const accent = planAccents[plan.code] ?? "#7c3aed";
          const isSelected = selectedPlan?.id === plan.id;
          return (
            <article
              key={plan.id}
              className="relative overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{
                background: "var(--bg-surface)",
                borderColor: isSelected ? accent : "var(--border-default)",
                boxShadow: isSelected ? `0 0 0 2px ${accent}20` : "var(--shadow-sm)",
              }}
            >
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${accent}14`, color: accent }}>
                  <CreditCard size={19} />
                </span>
                <PlanState active={plan.active} />
              </div>
              <h3 className="mt-5 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
              <p className="font-mono text-xs font-semibold tracking-wider" style={{ color: accent }}>{plan.code}</p>
              <p className="mt-3 min-h-10 text-sm leading-5" style={{ color: "var(--text-secondary)" }}>
                {plan.description ?? "No plan description provided."}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Metric label="Tenants" value={plan.tenantCount} />
                <Metric label="Features" value={`${plan.enabledFeatureCount}/${plan.totalFeatureCount}`} />
              </div>
              <div className="mt-5 flex gap-2">
                <Button size="sm" variant={isSelected ? "primary" : "secondary"} className="flex-1" onClick={() => onSelectPlan(plan)}>
                  <Eye size={15} /> Details
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onEditPlan(plan)} aria-label={`Edit ${plan.name}`}>
                  <Edit3 size={16} />
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {selectedPlan ? (
        <SectionCard
          title="Plan Details"
          subtitle="Configuration summary and assignment availability."
          action={<Button size="sm" variant="secondary" onClick={() => onEditPlan(selectedPlan)}><Edit3 size={15} /> Edit plan</Button>}
        >
          <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{selectedPlan.name}</h3>
                <span className="rounded-lg px-2 py-1 font-mono text-xs font-semibold" style={{ background: "var(--brand-soft)", color: "var(--brand-action)" }}>{selectedPlan.code}</span>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                {selectedPlan.description ?? "No description has been added to this plan."}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Metric label="Assigned tenants" value={selectedPlan.tenantCount} spacious />
                <Metric label="Enabled features" value={selectedPlan.enabledFeatureCount} spacious />
                <Metric label="Display order" value={selectedPlan.displayOrder} spacious />
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border p-5" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} style={{ color: "var(--brand-action)" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Assignment status</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Controls future manual and billing assignments.</p>
                </div>
              </div>
              <Switch
                label={selectedPlan.active ? "Available for assignment" : "Plan disabled"}
                checked={selectedPlan.active}
                disabled={statusPending || selectedPlan.code === "FREE"}
                onChange={(event) => onSetActive(selectedPlan, event.target.checked)}
              />
              {selectedPlan.code === "FREE" ? (
                <p className="text-xs leading-5" style={{ color: "var(--text-tertiary)" }}>
                  FREE remains enabled because every new tenant receives it automatically.
                </p>
              ) : null}
            </div>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}

function TenantSubscriptionsSection({
  subscriptions,
  plans,
  search,
  onSearch,
  onManage,
  onDeactivate,
}: {
  subscriptions: TenantSubscription[];
  plans: SubscriptionPlan[];
  search: string;
  onSearch: (value: string) => void;
  onManage: (subscription: TenantSubscription) => void;
  onDeactivate: (subscription: TenantSubscription) => void;
}) {
  return (
    <SectionCard
      title="Tenant Subscriptions"
      subtitle="Assign plans manually today; payment services can use the same subscription workflow later."
      action={(
        <SearchField
          label="Search subscriptions"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          onClear={() => onSearch("")}
          placeholder="Tenant, plan, status..."
          className="w-full sm:w-72"
        />
      )}
      variant="table"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)", background: "var(--bg-muted)" }}>
              <th className="px-5 py-3">Tenant</th>
              <th className="px-4 py-3">Current plan</th>
              <th className="px-4 py-3">Assigned date</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => (
              <tr key={subscription.id} className="transition-colors hover:bg-primary-50/30 dark:hover:bg-primary-950/10">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/10 text-sm font-bold text-purple-600">
                      {subscription.tenantName[0]?.toUpperCase() ?? "T"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{subscription.tenantName}</p>
                      <p className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{subscription.tenantKey}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold" style={{ color: planAccents[subscription.planCode] ?? "var(--brand-action)" }}>{subscription.planName}</p>
                  <p className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{subscription.planCode}</p>
                </td>
                <td className="px-4 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>{formatDate(subscription.assignedDate)}</td>
                <td className="px-4 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>{subscription.expiresAt ? formatDate(subscription.expiresAt) : "Unlimited"}</td>
                <td className="px-4 py-4"><SubscriptionStatusBadge status={subscription.status} /></td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onManage(subscription)}>
                      {assignmentIcon(subscription, plans)} Manage plan
                    </Button>
                    {subscription.active ? (
                      <Button size="icon" variant="ghost" onClick={() => onDeactivate(subscription)} aria-label={`Deactivate ${subscription.tenantName} subscription`}>
                        <Power size={16} className="text-red-500" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {subscriptions.length === 0 ? (
        <EmptyState
          icon={<Search size={26} />}
          title="No matching subscriptions"
          description="Try a different tenant, plan, or status search."
        />
      ) : null}
    </SectionCard>
  );
}

function FeatureMatrixSection({
  plans,
  features,
  pending,
  onToggle,
}: {
  plans: SubscriptionPlan[];
  features: Array<{ featureId: number; featureKey: string; displayName: string; plans: Record<string, boolean> }>;
  pending: boolean;
  onToggle: (plan: SubscriptionPlan, featureKey: string, enabled: boolean) => void;
}) {
  return (
    <SectionCard
      title="Feature Matrix"
      subtitle="Feature keys remain stable while availability can change independently for every plan."
      action={(
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600">
          <Sparkles size={14} /> All changes apply immediately
        </span>
      )}
      variant="table"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)", background: "var(--bg-muted)" }}>
              <th className="sticky left-0 z-10 min-w-56 px-5 py-3" style={{ background: "var(--bg-muted)" }}>Feature</th>
              {plans.map((plan) => (
                <th key={plan.id} className="min-w-36 px-4 py-3 text-center">
                  <span style={{ color: planAccents[plan.code] ?? "var(--text-secondary)" }}>{plan.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.featureId} className="transition-colors hover:bg-primary-50/20 dark:hover:bg-primary-950/10">
                <td className="sticky left-0 z-10 px-5 py-3.5" style={{ background: "var(--bg-surface)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{feature.displayName}</p>
                  <p className="font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>{feature.featureKey}</p>
                </td>
                {plans.map((plan) => {
                  const enabled = Boolean(feature.plans[plan.code]);
                  return (
                    <td key={plan.id} className="px-4 py-3.5 text-center">
                      <Switch
                        aria-label={`${enabled ? "Disable" : "Enable"} ${feature.displayName} for ${plan.name}`}
                        checked={enabled}
                        disabled={pending}
                        onChange={(event) => onToggle(plan, feature.featureKey, event.target.checked)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function Metric({ label, value, spacious = false }: { label: string; value: string | number; spacious?: boolean }) {
  return (
    <div className={`rounded-xl border ${spacious ? "p-4" : "px-3 py-2.5"}`} style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
      <p className={spacious ? "text-xl font-semibold" : "text-sm font-semibold"} style={{ color: "var(--text-primary)" }}>{value}</p>
      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{label}</p>
    </div>
  );
}

function PlanState({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-500"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Active" : "Disabled"}
    </span>
  );
}

function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const styles: Record<SubscriptionStatus, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-600",
    INACTIVE: "bg-slate-500/10 text-slate-500",
    EXPIRED: "bg-amber-500/10 text-amber-600",
    PLAN_DISABLED: "bg-red-500/10 text-red-600",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.replaceAll("_", " ")}
    </span>
  );
}

function assignmentIcon(subscription: TenantSubscription, plans: SubscriptionPlan[]) {
  const currentOrder = plans.find((plan) => plan.code === subscription.planCode)?.displayOrder ?? 0;
  const hasHigherPlan = plans.some((plan) => plan.active && plan.displayOrder > currentOrder);
  return hasHigherPlan ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />;
}

function featureLabel(featureKey: string): string {
  return featureKey.toLowerCase().split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
