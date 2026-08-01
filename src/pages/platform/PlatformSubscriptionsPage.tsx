import { useMemo, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Edit3,
  Layers3,
  MessageSquare,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Users,
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
  useCreateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,
  useSetPlanFeatureMutation,
  useSetSubscriptionPlanActiveMutation,
  useSubscriptionOverviewQuery,
  useUpdateSubscriptionPlanMutation,
} from "@/hooks/queries/useSubscriptionQueries";
import { PlanEditorDialog } from "@/modules/subscriptions/components/PlanEditorDialog";
import type {
  FeatureMatrixRow,
  SubscriptionPlan,
  SubscriptionPlanInput,
  SubscriptionStatus,
  TenantSubscription,
} from "@/modules/subscriptions/types";
import { getErrorMessage } from "@/utils/errorHandler";

type SubscriptionTab = "dashboard" | "packages" | "builder" | "tenants" | "usage";
type FeatureCategory = "Overview" | "People" | "Work" | "Communication" | "Analytics" | "Administration" | "Future";

const tabs: Array<{ id: SubscriptionTab; label: string; icon: React.ReactNode }> = [
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={16} /> },
  { id: "packages", label: "Packages", icon: <CreditCard size={16} /> },
  { id: "builder", label: "Package Builder", icon: <Layers3 size={16} /> },
  { id: "tenants", label: "Tenant Subscriptions", icon: <Building2 size={16} /> },
  { id: "usage", label: "Usage Statistics", icon: <MoreHorizontal size={16} /> },
];

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

const categoryIcons: Record<FeatureCategory, React.ReactNode> = {
  Overview: <Sparkles size={17} />,
  People: <Users size={17} />,
  Work: <BriefcaseBusiness size={17} />,
  Communication: <MessageSquare size={17} />,
  Analytics: <BarChart3 size={17} />,
  Administration: <Settings size={17} />,
  Future: <PackageCheck size={17} />,
};

export function PlatformSubscriptionsPage() {
  usePageMeta({ title: "Subscription Management", breadcrumb: ["Platform", "Subscriptions"] });
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SubscriptionTab>("dashboard");
  const [planEditorTarget, setPlanEditorTarget] = useState<SubscriptionPlan | null | undefined>(undefined);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);
  const [tenantSearch, setTenantSearch] = useState("");
  const [featureSearch, setFeatureSearch] = useState("");
  const [category, setCategory] = useState<FeatureCategory | "All">("All");

  const overviewQuery = useSubscriptionOverviewQuery(true);
  const createPlanMutation = useCreateSubscriptionPlanMutation();
  const updatePlanMutation = useUpdateSubscriptionPlanMutation();
  const deletePlanMutation = useDeleteSubscriptionPlanMutation();
  const setPlanActiveMutation = useSetSubscriptionPlanActiveMutation();
  const setFeatureMutation = useSetPlanFeatureMutation();

  const data = overviewQuery.data;
  const selectedPlan = data?.plans.find((plan) => plan.id === selectedPlanId)
    ?? data?.plans[0]
    ?? null;
  const errorMessage = overviewQuery.error
    ? getErrorMessage(overviewQuery.error, "Could not load subscription management data.")
    : null;

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

  const filteredFeatures = useMemo(() => {
    const query = featureSearch.trim().toLowerCase();
    const features = data?.featureMatrix.features ?? [];
    return features.filter((feature) => {
      const featureCategory = categoryForFeature(feature.featureKey);
      const matchesCategory = category === "All" || featureCategory === category;
      const matchesSearch = !query || `${feature.displayName} ${feature.featureKey}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, data, featureSearch]);

  const savePlan = async (input: SubscriptionPlanInput) => {
    try {
      const saved = planEditorTarget
        ? await updatePlanMutation.mutateAsync({ planId: planEditorTarget.id, payload: input })
        : await createPlanMutation.mutateAsync(input);
      setSelectedPlanId(saved.id);
      setPlanEditorTarget(undefined);
      toast.success({
        title: planEditorTarget ? "Package updated" : "Package created",
        description: `${saved.name} is ready for package management.`,
      });
    } catch (error) {
      toast.error({ title: "Package was not saved", description: getErrorMessage(error) });
    }
  };

  const setPlanActive = async (plan: SubscriptionPlan, active: boolean) => {
    try {
      await setPlanActiveMutation.mutateAsync({ planId: plan.id, active });
      toast.success({
        title: active ? "Package enabled" : "Package disabled",
        description: `${plan.name} ${active ? "is visible to tenant admins" : "is hidden from new tenant selections"}.`,
      });
    } catch (error) {
      toast.error({ title: "Package status was not changed", description: getErrorMessage(error) });
    }
  };

  const setFeature = async (plan: SubscriptionPlan, featureKey: string, enabled: boolean) => {
    try {
      await setFeatureMutation.mutateAsync({ planId: plan.id, featureKey, enabled });
      toast.success({
        title: enabled ? "Feature included" : "Feature removed",
        description: `${featureLabel(featureKey)} was updated for ${plan.name}.`,
      });
    } catch (error) {
      toast.error({ title: "Feature was not updated", description: getErrorMessage(error) });
    }
  };

  const deletePackage = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlanMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success({ title: "Package deleted", description: `${deleteTarget.name} was removed from the catalogue.` });
    } catch (error) {
      toast.error({ title: "Package was not deleted", description: getErrorMessage(error) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Management"
        description="Build SaaS packages, control feature access, and monitor tenant subscriptions without payment-provider coupling."
        primaryActions={(
          <Button onClick={() => setPlanEditorTarget(null)}>
            <Plus size={16} /> Create package
          </Button>
        )}
      />

      {errorMessage ? <ErrorState message={errorMessage} onRetry={() => void overviewQuery.refetch()} /> : null}
      {overviewQuery.isLoading ? <SectionCard><LoadingSkeleton lines={10} className="h-72" /></SectionCard> : null}

      {!overviewQuery.isLoading && !errorMessage && data ? (
        <>
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

          {activeTab === "dashboard" ? (
            <DashboardSection plans={data.plans} subscriptions={data.tenantSubscriptions} statistics={data.statistics} />
          ) : null}

          {activeTab === "packages" ? (
            <PackagesSection
              plans={data.plans}
              selectedPlan={selectedPlan}
              onSelectPlan={(plan) => {
                setSelectedPlanId(plan.id);
                setActiveTab("builder");
              }}
              onEditPlan={(plan) => setPlanEditorTarget(plan)}
              onDeletePlan={setDeleteTarget}
              onSetActive={(plan, active) => void setPlanActive(plan, active)}
              statusPending={setPlanActiveMutation.isPending}
            />
          ) : null}

          {activeTab === "builder" ? (
            <PackageBuilderSection
              plans={data.plans}
              selectedPlan={selectedPlan}
              features={filteredFeatures}
              featureSearch={featureSearch}
              category={category}
              pending={setFeatureMutation.isPending}
              onSelectPlan={(plan) => setSelectedPlanId(plan.id)}
              onFeatureSearch={setFeatureSearch}
              onCategory={setCategory}
              onToggle={(plan, featureKey, enabled) => void setFeature(plan, featureKey, enabled)}
            />
          ) : null}

          {activeTab === "tenants" ? (
            <TenantSubscriptionsSection
              subscriptions={filteredSubscriptions}
              search={tenantSearch}
              onSearch={setTenantSearch}
            />
          ) : null}

          {activeTab === "usage" ? (
            <UsageSection plans={data.plans} statistics={data.statistics} />
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
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete package?"
        description={`${deleteTarget?.name ?? "This package"} will be removed from the package catalogue. Packages assigned to tenants cannot be deleted.`}
        confirmLabel="Delete"
        loading={deletePlanMutation.isPending}
        onConfirm={() => void deletePackage()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DashboardSection({
  plans,
  subscriptions,
  statistics,
}: {
  plans: SubscriptionPlan[];
  subscriptions: TenantSubscription[];
  statistics: {
    totalPackages: number;
    activePackages: number;
    totalTenants: number;
    subscribedTenants: number;
    planDistribution: Record<string, number>;
    mostPopularPackage?: string | null;
    recentlyUpgraded: number;
  };
}) {
  const latestChanges = subscriptions
    .slice()
    .sort((left, right) => new Date(right.assignedDate).getTime() - new Date(left.assignedDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total packages" value={statistics.totalPackages} icon={<PackageCheck size={20} />} accentColor="#2563eb" />
        <StatCard label="Active packages" value={statistics.activePackages} icon={<CheckCircle2 size={20} />} accentColor="#059669" />
        <StatCard label="Subscribed tenants" value={statistics.subscribedTenants} icon={<Building2 size={20} />} accentColor="#7c3aed" />
        <StatCard label="Most popular" value={statistics.mostPopularPackage ?? "None"} icon={<Sparkles size={20} />} accentColor="#d97706" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <SectionCard title="Package Distribution" subtitle="Live tenant count by current package.">
          <div className="space-y-4">
            {plans.map((plan) => {
              const count = statistics.planDistribution[plan.code] ?? 0;
              const percent = statistics.totalTenants > 0 ? Math.round((count / statistics.totalTenants) * 100) : 0;
              return (
                <div key={plan.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{plan.name}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{count} tenants</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full" style={{ background: "var(--bg-muted)" }}>
                    <div className="h-2 rounded-full" style={{ width: `${percent}%`, background: planColor(plan) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
        <SectionCard title="Latest Upgrades" subtitle="Recent package activation changes.">
          <div className="space-y-3">
            {latestChanges.map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{subscription.tenantName}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{subscription.planName} package</p>
                </div>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{formatDate(subscription.assignedDate)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function PackagesSection({
  plans,
  selectedPlan,
  onSelectPlan,
  onEditPlan,
  onDeletePlan,
  onSetActive,
  statusPending,
}: {
  plans: SubscriptionPlan[];
  selectedPlan: SubscriptionPlan | null;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  onEditPlan: (plan: SubscriptionPlan) => void;
  onDeletePlan: (plan: SubscriptionPlan) => void;
  onSetActive: (plan: SubscriptionPlan, active: boolean) => void;
  statusPending: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {plans.map((plan) => {
        const accent = planColor(plan);
        const selected = selectedPlan?.id === plan.id;
        return (
          <article
            key={plan.id}
            className="relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{
              background: "var(--bg-surface)",
              borderColor: selected ? accent : "var(--border-default)",
              boxShadow: selected ? `0 0 0 2px ${accent}24` : "var(--shadow-sm)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${accent}16`, color: accent }}>
                <PackageCheck size={20} />
              </span>
              <PlanState active={plan.active} />
            </div>
            <div className="mt-5 flex items-center gap-2">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
              {plan.badge ? <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${accent}18`, color: accent }}>{plan.badge}</span> : null}
            </div>
            <p className="mt-1 font-mono text-xs font-semibold" style={{ color: accent }}>{plan.code}</p>
            <p className="mt-3 min-h-12 text-sm leading-5" style={{ color: "var(--text-secondary)" }}>
              {plan.description ?? "No package description provided."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Metric label="Monthly" value={formatMoney(plan.monthlyPrice)} />
              <Metric label="Yearly" value={formatMoney(plan.yearlyPrice)} />
              <Metric label="Tenants" value={plan.tenantCount} />
              <Metric label="Features" value={`${plan.enabledFeatureCount}/${plan.totalFeatureCount}`} />
            </div>
            <div className="mt-auto flex gap-2 pt-5">
              <Button size="sm" variant="secondary" className="flex-1" onClick={() => onSelectPlan(plan)}>
                <Layers3 size={15} /> Build
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onEditPlan(plan)} aria-label={`Edit ${plan.name}`}>
                <Edit3 size={16} />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onDeletePlan(plan)} disabled={plan.code === "FREE" || plan.tenantCount > 0} aria-label={`Delete ${plan.name}`}>
                <Trash2 size={16} className="text-red-500" />
              </Button>
            </div>
            <div className="mt-4 rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
              <Switch
                label={plan.active ? "Available" : "Hidden"}
                checked={plan.active}
                disabled={statusPending || plan.code === "FREE"}
                onChange={(event) => onSetActive(plan, event.target.checked)}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PackageBuilderSection({
  plans,
  selectedPlan,
  features,
  featureSearch,
  category,
  pending,
  onSelectPlan,
  onFeatureSearch,
  onCategory,
  onToggle,
}: {
  plans: SubscriptionPlan[];
  selectedPlan: SubscriptionPlan | null;
  features: FeatureMatrixRow[];
  featureSearch: string;
  category: FeatureCategory | "All";
  pending: boolean;
  onSelectPlan: (plan: SubscriptionPlan) => void;
  onFeatureSearch: (value: string) => void;
  onCategory: (value: FeatureCategory | "All") => void;
  onToggle: (plan: SubscriptionPlan, featureKey: string, enabled: boolean) => void;
}) {
  const grouped = groupFeatures(features);
  if (!selectedPlan) {
    return <EmptyState icon={<PackageCheck size={26} />} title="No packages yet" description="Create a package before assigning features." />;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
      <SectionCard title="Packages" subtitle="Choose a package to configure.">
        <div className="space-y-2">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelectPlan(plan)}
              className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors"
              style={{
                borderColor: selectedPlan.id === plan.id ? planColor(plan) : "var(--border-default)",
                background: selectedPlan.id === plan.id ? `${planColor(plan)}12` : "var(--bg-muted)",
              }}
            >
              <span>
                <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{plan.name}</span>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{plan.enabledFeatureCount} features</span>
              </span>
              {selectedPlan.id === plan.id ? <Check size={16} style={{ color: planColor(plan) }} /> : null}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title={`${selectedPlan.name} Package Builder`}
        subtitle="Select feature groups with large controls. Changes apply immediately across subscribed tenants."
        action={(
          <SearchField
            label="Search features"
            value={featureSearch}
            onChange={(event) => onFeatureSearch(event.target.value)}
            onClear={() => onFeatureSearch("")}
            placeholder="Search features..."
            className="w-full sm:w-72"
          />
        )}
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {(["All", "Overview", "People", "Work", "Communication", "Analytics", "Administration", "Future"] as Array<FeatureCategory | "All">).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onCategory(item)}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors"
              style={{
                borderColor: category === item ? planColor(selectedPlan) : "var(--border-default)",
                background: category === item ? `${planColor(selectedPlan)}12` : "var(--bg-muted)",
                color: category === item ? planColor(selectedPlan) : "var(--text-secondary)",
              }}
            >
              {item === "All" ? <Layers3 size={16} /> : categoryIcons[item]}
              {item}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {Object.entries(grouped).map(([groupName, groupFeatures]) => (
            <section key={groupName}>
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: `${planColor(selectedPlan)}14`, color: planColor(selectedPlan) }}>
                  {categoryIcons[groupName as FeatureCategory]}
                </span>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{groupName}</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {groupFeatures.map((feature) => {
                  const enabled = Boolean(feature.plans[selectedPlan.code]);
                  return (
                    <button
                      key={feature.featureId}
                      type="button"
                      disabled={pending}
                      onClick={() => onToggle(selectedPlan, feature.featureKey, !enabled)}
                      className="flex min-h-[76px] items-center gap-3 rounded-xl border p-4 text-left transition-all disabled:opacity-60"
                      style={{
                        borderColor: enabled ? planColor(selectedPlan) : "var(--border-default)",
                        background: enabled ? `${planColor(selectedPlan)}10` : "var(--bg-muted)",
                      }}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: enabled ? planColor(selectedPlan) : "var(--bg-surface)", color: enabled ? "white" : "var(--text-tertiary)" }}>
                        {enabled ? <Check size={17} /> : <Plus size={17} />}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{feature.displayName}</span>
                        <span className="font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>{feature.featureKey}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        {features.length === 0 ? <EmptyState icon={<Search size={26} />} title="No matching features" description="Try another search or category." /> : null}
      </SectionCard>
    </div>
  );
}

function TenantSubscriptionsSection({
  subscriptions,
  search,
  onSearch,
}: {
  subscriptions: TenantSubscription[];
  search: string;
  onSearch: (value: string) => void;
}) {
  return (
    <SectionCard
      title="Tenant Subscriptions"
      subtitle="Each tenant has exactly one current package. Tenant admins select upgrades and downgrades from their workspace."
      action={(
        <SearchField
          label="Search subscriptions"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          onClear={() => onSearch("")}
          placeholder="Tenant, package, status..."
          className="w-full sm:w-72"
        />
      )}
      variant="table"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)", background: "var(--bg-muted)" }}>
              <th className="px-5 py-3">Tenant</th>
              <th className="px-4 py-3">Current Package</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Activated Date</th>
              <th className="px-4 py-3">Expires</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => (
              <tr key={subscription.id} className="transition-colors hover:bg-primary-50/30 dark:hover:bg-primary-950/10">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-600">
                      {subscription.tenantName[0]?.toUpperCase() ?? "T"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{subscription.tenantName}</p>
                      <p className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{subscription.tenantKey}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold" style={{ color: "var(--brand-action)" }}>{subscription.planName}</p>
                  <p className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{subscription.planCode}</p>
                </td>
                <td className="px-4 py-4"><SubscriptionStatusBadge status={subscription.status} /></td>
                <td className="px-4 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>{formatDate(subscription.assignedDate)}</td>
                <td className="px-4 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>{subscription.expiresAt ? formatDate(subscription.expiresAt) : "Unlimited"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {subscriptions.length === 0 ? (
        <EmptyState icon={<Search size={26} />} title="No matching subscriptions" description="Try a different tenant, package, or status search." />
      ) : null}
    </SectionCard>
  );
}

function UsageSection({
  plans,
  statistics,
}: {
  plans: SubscriptionPlan[];
  statistics: { totalTenants: number; planDistribution: Record<string, number>; recentlyUpgraded: number; recentlyExpired: number };
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <SectionCard title="Usage Snapshot" subtitle="Subscription signals separated from payments.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Total tenants" value={statistics.totalTenants} spacious />
          <Metric label="Recent upgrades" value={statistics.recentlyUpgraded} spacious />
          <Metric label="Recently expired" value={statistics.recentlyExpired} spacious />
          <Metric label="Packages" value={plans.length} spacious />
        </div>
      </SectionCard>
      <SectionCard title="Package Mix" subtitle="Current tenant distribution by package.">
        <div className="grid gap-3 md:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{plan.name}</span>
                <span className="text-xl font-semibold" style={{ color: planColor(plan) }}>{statistics.planDistribution[plan.code] ?? 0}</span>
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>{plan.enabledFeatureCount} enabled features</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function groupFeatures(features: FeatureMatrixRow[]): Partial<Record<FeatureCategory, FeatureMatrixRow[]>> {
  return features.reduce<Partial<Record<FeatureCategory, FeatureMatrixRow[]>>>((groups, feature) => {
    const featureCategory = categoryForFeature(feature.featureKey);
    groups[featureCategory] = [...(groups[featureCategory] ?? []), feature];
    return groups;
  }, {});
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
      {active ? "Active" : "Hidden"}
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

function categoryForFeature(featureKey: string): FeatureCategory {
  return featureCategoryMap[featureKey] ?? "Future";
}

function planColor(plan: SubscriptionPlan): string {
  return plan.color || "#2563eb";
}

function featureLabel(featureKey: string): string {
  return featureKey.toLowerCase().split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMoney(value: number): string {
  if (!value) return "Free";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
