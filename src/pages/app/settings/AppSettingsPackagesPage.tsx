import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  MessageSquare,
  PackageCheck,
  PanelRightClose,
  ShieldCheck,
  Sparkles,
  Users,
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
import type { FeatureMatrixRow, SubscriptionPlan } from "@/modules/subscriptions/types";
import { useBranding } from "@/features/branding/useBranding";
import { getErrorMessage } from "@/utils/errorHandler";

type FeatureCategory = "Overview" | "People" | "Work" | "Communication" | "Analytics" | "Administration" | "Future";

const billingDisabled = true;

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
  Overview: <Sparkles size={17} />,
  People: <Users size={17} />,
  Work: <BriefcaseBusiness size={17} />,
  Communication: <MessageSquare size={17} />,
  Analytics: <BarChart3 size={17} />,
  Administration: <ShieldCheck size={17} />,
  Future: <PackageCheck size={17} />,
};

export function AppSettingsPackagesPage() {
  usePageMeta({ title: "Packages", breadcrumb: ["Settings", "Packages"] });
  const { tenantKey } = useAuth();
  const { branding } = useBranding();
  const resolvedTenantKey = tenantKey ?? undefined;
  const toast = useToast();
  const [targetPlan, setTargetPlan] = useState<SubscriptionPlan | null>(null);
  const catalogQuery = useTenantPackageCatalogQuery(resolvedTenantKey, true);
  const selectPackageMutation = useSelectTenantPackageMutation(resolvedTenantKey);

  const data = catalogQuery.data;
  const currentPlan = data?.plans.find((plan) => plan.code === data.currentSubscription.planCode) ?? null;
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const selectedPlan = data?.plans.find((plan) => plan.id === selectedPlanId)
    ?? currentPlan
    ?? data?.plans[0]
    ?? null;
  const features = useMemo(() => data?.featureMatrix.features ?? [], [data]);

  const applyPackage = async () => {
    if (!targetPlan) return;
    try {
      await selectPackageMutation.mutateAsync(targetPlan.code);
      toast.success({
        title: "Package updated",
        description: `${targetPlan.name} features are now applied to this workspace.`,
      });
      setTargetPlan(null);
      setSelectedPlanId(targetPlan.id);
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
          <SectionCard>
            <CurrentSubscription
              companyName={branding.companyName}
              currentPlan={currentPlan}
              activeFeatures={data.currentSubscription.features.length}
              assignedDate={data.currentSubscription.assignedDate}
              expiresAt={data.currentSubscription.expiresAt}
              onCompare={() => setSelectedPlanId(currentPlan?.id ?? data.plans[0]?.id ?? null)}
            />
          </SectionCard>

          <SectionCard
            title="Available Plans"
            subtitle="Choose the package that matches the workspace you are running today."
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-3">
                {data.plans.map((plan) => (
                  <PlanOption
                    key={plan.id}
                    plan={plan}
                    currentPlan={currentPlan}
                    selected={selectedPlan?.id === plan.id}
                    features={features}
                    onSelect={() => setSelectedPlanId(plan.id)}
                    onApply={(target) => setTargetPlan(target)}
                  />
                ))}
              </div>
              <AnimatePresence mode="wait">
                {selectedPlan ? (
                  <PlanDetailsPanel
                    key={selectedPlan.id}
                    plan={selectedPlan}
                    currentPlan={currentPlan}
                    features={features}
                    onClose={() => setSelectedPlanId(null)}
                    onApply={(target) => setTargetPlan(target)}
                  />
                ) : null}
              </AnimatePresence>
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
        confirmLabel={targetPlan ? resolvePackageAction(currentPlan, targetPlan) : "Apply package"}
        loading={selectPackageMutation.isPending}
        onConfirm={() => void applyPackage()}
        onCancel={() => setTargetPlan(null)}
      />
    </div>
  );
}

function CurrentSubscription({
  companyName,
  currentPlan,
  activeFeatures,
  assignedDate,
  expiresAt,
  onCompare,
}: {
  companyName: string;
  currentPlan: SubscriptionPlan | null;
  activeFeatures: number;
  assignedDate: string;
  expiresAt?: string | null;
  onCompare: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ background: "var(--brand-soft)", color: "var(--brand-action)" }}>
            <PackageCheck size={25} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: "var(--text-tertiary)" }}>{companyName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>{currentPlan?.name ?? "No package"}</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: "color-mix(in srgb, #10b981 32%, transparent)", color: "#059669", background: "color-mix(in srgb, #10b981 10%, transparent)" }}>
                <CheckCircle2 size={14} /> Current Plan
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              {currentPlan?.description ?? "Select a package to activate feature access."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10" disabled>
            <CheckCircle2 size={16} /> Current Plan
          </Button>
          <Button type="button" variant="secondary" onClick={onCompare}>
            Compare Plans
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SubscriptionMetric label="Features" value={activeFeatures} />
        <SubscriptionMetric label="Monthly" value={currentPlan ? pricePer(currentPlan.monthlyPrice, "month") : "Not set"} />
        <SubscriptionMetric label="Yearly" value={currentPlan ? pricePer(currentPlan.yearlyPrice, "year") : "Not set"} />
        <SubscriptionMetric label="Renewal" value={expiresAt ? formatShortDate(expiresAt) : `Since ${formatShortDate(assignedDate)}`} />
      </div>
    </div>
  );
}

function PlanOption({
  plan,
  currentPlan,
  selected,
  features,
  onSelect,
  onApply,
}: {
  plan: SubscriptionPlan;
  currentPlan: SubscriptionPlan | null;
  selected: boolean;
  features: FeatureMatrixRow[];
  onSelect: () => void;
  onApply: (plan: SubscriptionPlan) => void;
}) {
  const isCurrent = plan.code === currentPlan?.code;
  const includedFeatures = getPlanFeatures(plan, features);
  const preview = includedFeatures.slice(0, 6);
  const moreCount = Math.max(0, includedFeatures.length - preview.length);
  const action = resolvePackageAction(currentPlan, plan);
  const isDowngrade = action === "Downgrade";

  return (
    <motion.article
      layout
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      className="rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: selected ? "color-mix(in srgb, var(--brand-action) 5%, var(--bg-surface))" : "var(--bg-surface)",
        borderColor: selected ? "var(--brand-border)" : "var(--border-default)",
        boxShadow: selected ? "0 10px 28px color-mix(in srgb, var(--brand-action) 10%, transparent)" : "var(--shadow-sm)",
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: tint(planColor(plan), 10), color: planColor(plan) }}>
            <PackageCheck size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
              {plan.recommended ? <Badge color="var(--brand-action)">Recommended</Badge> : null}
              {isCurrent ? <Badge color="#059669">Current Plan</Badge> : null}
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{plan.description ?? "No package description provided."}</p>
            <FeaturePreview features={preview} moreCount={moreCount} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] lg:min-w-[320px] lg:grid-cols-[1fr_120px] lg:items-start">
          <PriceStack plan={plan} compact />
          <PlanActionButton
            action={action}
            isCurrent={isCurrent}
            isSelected={selected && !isCurrent}
            isDowngrade={isDowngrade}
            onClick={(event) => {
              event.stopPropagation();
              if (!isCurrent) onApply(plan);
            }}
          />
        </div>
      </div>
    </motion.article>
  );
}

function PlanDetailsPanel({
  plan,
  currentPlan,
  features,
  onClose,
  onApply,
}: {
  plan: SubscriptionPlan;
  currentPlan: SubscriptionPlan | null;
  features: FeatureMatrixRow[];
  onClose: () => void;
  onApply: (plan: SubscriptionPlan) => void;
}) {
  const includedFeatures = getPlanFeatures(plan, features);
  const grouped = groupByCategory(includedFeatures);
  const action = resolvePackageAction(currentPlan, plan);
  const isCurrent = plan.code === currentPlan?.code;
  const isDowngrade = action === "Downgrade";

  return (
    <motion.aside
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 18 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="sticky top-4 self-start rounded-2xl border p-5"
      style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: tint(planColor(plan), 10), color: planColor(plan) }}>
            <PackageCheck size={22} />
          </span>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
            {plan.recommended ? <Badge color="var(--brand-action)">Recommended</Badge> : null}
          </div>
        </div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl transition-colors hover:bg-[var(--bg-surface-hover)]" aria-label="Close plan details">
          <PanelRightClose size={18} />
        </button>
      </div>

      <p className="mt-4 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{plan.description ?? "No package description provided."}</p>

      <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
        <PriceStack plan={plan} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <SubscriptionMetric label="Features" value={includedFeatures.length} />
        <SubscriptionMetric label="Billing" value={billingDisabled ? "Beta" : plan.billingPeriod} />
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Included Features</h4>
        <div className="mt-3 space-y-4">
          {Object.entries(grouped).map(([category, categoryFeatures]) => (
            <div key={category}>
              <div className="mb-2 flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: "var(--bg-muted)", color: "var(--brand-action)" }}>
                  {categoryIcons[category as FeatureCategory]}
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{category}</span>
              </div>
              <div className="grid gap-2">
                {categoryFeatures.map((feature) => (
                  <span key={feature.featureId} className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <Check size={15} style={{ color: "var(--brand-action)" }} /> {feature.displayName}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        className={isDowngrade ? "mt-6 w-full border-red-500/40 text-red-600 hover:bg-red-500/10" : "mt-6 w-full"}
        variant={isCurrent ? "outline" : isDowngrade ? "outline" : "primary"}
        disabled={isCurrent}
        onClick={() => onApply(plan)}
      >
        {isCurrent ? <CheckCircle2 size={16} /> : isDowngrade ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
        {isCurrent ? "Current Plan" : action}
      </Button>
    </motion.aside>
  );
}

function PriceStack({ plan, compact = false }: { plan: SubscriptionPlan; compact?: boolean }) {
  const savings = yearlySavings(plan);
  return (
    <div className={compact ? "space-y-1.5 text-left lg:text-right" : "space-y-3"}>
      {billingDisabled ? (
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--brand-action)" }}>Free during beta</p>
      ) : null}
      <div className={compact ? "flex flex-wrap gap-x-3 gap-y-1 lg:block" : "grid gap-2"}>
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
          {pricePer(plan.monthlyPrice, "month")}
        </p>
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
          {pricePer(plan.yearlyPrice, "year")}
        </p>
      </div>
      {savings > 0 ? <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Save {savings}% yearly</p> : null}
    </div>
  );
}

function FeaturePreview({ features, moreCount }: { features: FeatureMatrixRow[]; moreCount: number }) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
      {features.map((feature) => (
        <span key={feature.featureId} className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <Check size={14} style={{ color: "var(--brand-action)" }} /> {feature.displayName}
        </span>
      ))}
      {moreCount > 0 ? <span className="text-sm font-medium" style={{ color: "var(--text-tertiary)" }}>+{moreCount} more</span> : null}
    </div>
  );
}

function PlanActionButton({
  action,
  isCurrent,
  isSelected,
  isDowngrade,
  onClick,
}: {
  action: string;
  isCurrent: boolean;
  isSelected: boolean;
  isDowngrade: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  if (isCurrent) {
    return (
      <Button type="button" variant="outline" className="border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10" disabled>
        <CheckCircle2 size={16} /> Current
      </Button>
    );
  }

  if (isSelected) {
    return (
      <Button type="button" variant="secondary" disabled>
        Selected
      </Button>
    );
  }

  return (
    <Button type="button" variant={isDowngrade ? "outline" : "primary"} className={isDowngrade ? "border-red-500/40 text-red-600 hover:bg-red-500/10" : ""} onClick={onClick}>
      {isDowngrade ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
      {action}
    </Button>
  );
}

function SubscriptionMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
      <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{label}</p>
    </div>
  );
}

function Badge({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: tint(color, 10), color }}>
      {children}
    </span>
  );
}

function getPlanFeatures(plan: SubscriptionPlan, features: FeatureMatrixRow[]): FeatureMatrixRow[] {
  return features.filter((feature) => Boolean(feature.plans[plan.code]));
}

function groupByCategory(features: FeatureMatrixRow[]): Partial<Record<FeatureCategory, FeatureMatrixRow[]>> {
  return features.reduce<Partial<Record<FeatureCategory, FeatureMatrixRow[]>>>((groups, feature) => {
    const category = categoryForFeature(feature.featureKey);
    groups[category] = [...(groups[category] ?? []), feature];
    return groups;
  }, {});
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
  return plan.color || "var(--brand-action)";
}

function pricePer(value: number, period: "month" | "year"): string {
  return `${formatMoney(value)} / ${period}`;
}

function formatMoney(value: number): string {
  if (!value) return "Free";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function yearlySavings(plan: SubscriptionPlan): number {
  if (!plan.monthlyPrice || !plan.yearlyPrice) return 0;
  const yearlyMonthlyEquivalent = plan.monthlyPrice * 12;
  if (plan.yearlyPrice >= yearlyMonthlyEquivalent) return 0;
  return Math.round(((yearlyMonthlyEquivalent - plan.yearlyPrice) / yearlyMonthlyEquivalent) * 100);
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
