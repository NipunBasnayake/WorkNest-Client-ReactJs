import { useMemo, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  MessageSquare,
  PackageCheck,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/AsyncStates";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { SectionCard } from "@/components/common/SectionCard";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useToast } from "@/hooks/useToast";
import {
  useSelectTenantPackageMutation,
  useTenantPackageCatalogQuery,
} from "@/hooks/queries/useSubscriptionQueries";
import type { SubscriptionPlan } from "@/modules/subscriptions/types";
import { getErrorMessage } from "@/utils/errorHandler";

type FeatureCategory = "Overview" | "People" | "Work" | "Communication" | "Analytics" | "Administration" | "Future";

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

export function AppSettingsPackagesPage() {
  usePageMeta({ title: "Packages", breadcrumb: ["Settings", "Packages"] });
  const { tenantKey } = useAuth();
  const resolvedTenantKey = tenantKey ?? undefined;
  const toast = useToast();
  const [targetPlan, setTargetPlan] = useState<SubscriptionPlan | null>(null);
  const catalogQuery = useTenantPackageCatalogQuery(resolvedTenantKey, true);
  const selectPackageMutation = useSelectTenantPackageMutation(resolvedTenantKey);

  const data = catalogQuery.data;
  const currentPlan = data?.plans.find((plan) => plan.code === data.currentSubscription.planCode) ?? null;
  const comparisonFeatures = useMemo(() => data?.featureMatrix.features ?? [], [data]);

  const applyPackage = async () => {
    if (!targetPlan) return;
    try {
      await selectPackageMutation.mutateAsync(targetPlan.code);
      toast.success({
        title: "Package updated",
        description: `${targetPlan.name} features are now applied to this workspace.`,
      });
      setTargetPlan(null);
    } catch (error) {
      toast.error({ title: "Package was not changed", description: getErrorMessage(error) });
    }
  };

  const errorMessage = catalogQuery.error
    ? getErrorMessage(catalogQuery.error, "Could not load packages.")
    : null;

  return (
    <div className="space-y-5">
      {errorMessage ? <ErrorState message={errorMessage} onRetry={() => void catalogQuery.refetch()} /> : null}
      {catalogQuery.isLoading ? <SectionCard><LoadingSkeleton lines={10} className="h-72" /></SectionCard> : null}

      {!catalogQuery.isLoading && !errorMessage && data ? (
        <>
          <SectionCard
            title="Workspace Package"
            subtitle="Choose the package that controls which WorkNest features are available in this tenant workspace."
          >
            <div className="grid gap-4 lg:grid-cols-4">
              {data.plans.map((plan) => (
                <PackageCard
                  key={plan.id}
                  plan={plan}
                  currentPlan={currentPlan}
                  onSelect={setTargetPlan}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Package Comparison" subtitle="Compare feature access before changing packages." variant="table">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)", background: "var(--bg-muted)" }}>
                    <th className="sticky left-0 z-10 min-w-56 px-5 py-3" style={{ background: "var(--bg-muted)" }}>Feature</th>
                    {data.plans.map((plan) => (
                      <th key={plan.id} className="min-w-40 px-4 py-3 text-center" style={{ color: planColor(plan) }}>{plan.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature) => (
                    <tr key={feature.featureId} className="transition-colors hover:bg-primary-50/20 dark:hover:bg-primary-950/10">
                      <td className="sticky left-0 z-10 px-5 py-3.5" style={{ background: "var(--bg-surface)" }}>
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}>
                            {categoryIcons[categoryForFeature(feature.featureKey)]}
                          </span>
                          <span>
                            <span className="block text-sm font-medium" style={{ color: "var(--text-primary)" }}>{feature.displayName}</span>
                            <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{categoryForFeature(feature.featureKey)}</span>
                          </span>
                        </div>
                      </td>
                      {data.plans.map((plan) => (
                        <td key={plan.id} className="px-4 py-3.5 text-center">
                          {feature.plans[plan.code] ? (
                            <span className="inline-grid h-8 w-8 place-items-center rounded-full bg-emerald-500/10 text-emerald-600"><Check size={17} /></span>
                          ) : (
                            <span className="inline-grid h-8 w-8 place-items-center rounded-full bg-slate-500/10 text-slate-400"><X size={17} /></span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      ) : null}

      {!catalogQuery.isLoading && !errorMessage && data?.plans.length === 0 ? (
        <EmptyState icon={<PackageCheck size={26} />} title="No packages available" description="The platform administrator has not activated any packages yet." />
      ) : null}

      <ConfirmDialog
        open={Boolean(targetPlan)}
        title={`${resolvePackageAction(currentPlan, targetPlan)} to ${targetPlan?.name ?? "package"}?`}
        description="The selected package will immediately change which features are available in this workspace."
        confirmLabel="Apply package"
        loading={selectPackageMutation.isPending}
        onConfirm={() => void applyPackage()}
        onCancel={() => setTargetPlan(null)}
      />
    </div>
  );
}

function PackageCard({
  plan,
  currentPlan,
  onSelect,
}: {
  plan: SubscriptionPlan;
  currentPlan: SubscriptionPlan | null;
  onSelect: (plan: SubscriptionPlan) => void;
}) {
  const isCurrent = plan.code === currentPlan?.code;
  const accent = planColor(plan);
  return (
    <article className="relative flex min-h-[300px] flex-col rounded-2xl border p-5" style={{ borderColor: isCurrent ? accent : "var(--border-default)", background: "var(--bg-surface)", boxShadow: isCurrent ? `0 0 0 2px ${accent}22` : "var(--shadow-sm)" }}>
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${accent}16`, color: accent }}>
          <PackageCheck size={20} />
        </span>
        {plan.badge ? <span className="rounded-full px-2 py-1 text-[11px] font-bold" style={{ background: `${accent}16`, color: accent }}>{plan.badge}</span> : null}
      </div>
      <h3 className="mt-5 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
      <p className="mt-2 text-2xl font-semibold" style={{ color: accent }}>{formatMoney(plan.monthlyPrice)}<span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}> / month</span></p>
      <p className="mt-3 min-h-12 text-sm leading-5" style={{ color: "var(--text-secondary)" }}>{plan.description ?? "No package description provided."}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}>{plan.enabledFeatureCount} features</span>
        {isCurrent ? <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600"><CheckCircle2 size={14} /> Current</span> : null}
      </div>
      <Button className="mt-auto" variant={isCurrent ? "secondary" : "primary"} disabled={isCurrent} onClick={() => onSelect(plan)}>
        {isCurrent ? "Selected" : resolvePackageAction(currentPlan, plan)}
      </Button>
    </article>
  );
}

function resolvePackageAction(currentPlan: SubscriptionPlan | null, targetPlan: SubscriptionPlan | null): string {
  if (!targetPlan || !currentPlan) return "Select";
  if (targetPlan.displayOrder > currentPlan.displayOrder) return "Upgrade";
  if (targetPlan.displayOrder < currentPlan.displayOrder) return "Downgrade";
  return "Select";
}

function categoryForFeature(featureKey: string): FeatureCategory {
  return featureCategoryMap[featureKey] ?? "Future";
}

function planColor(plan: SubscriptionPlan): string {
  return plan.color || "#2563eb";
}

function formatMoney(value: number): string {
  if (!value) return "Free";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
