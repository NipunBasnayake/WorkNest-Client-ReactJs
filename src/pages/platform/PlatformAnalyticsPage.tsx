import { useMemo } from "react";
import { Activity, BriefcaseBusiness, Building2, CheckCircle2, ListTodo, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { usePlatformAnalyticsQuery } from "@/hooks/queries/usePlatformQueries";
import { BarChart } from "@/modules/analytics/components/BarChart";
import { DonutChart } from "@/modules/analytics/components/DonutChart";
import { PlatformTrendChart } from "@/modules/platform/components/PlatformTrendChart";
import { PlatformStatusBadge } from "@/modules/platform/components/PlatformStatusBadge";
import { StatCard } from "@/components/common/AppUI";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/AsyncStates";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { getErrorMessage } from "@/utils/errorHandler";
import { formatRelativeTime } from "@/utils/formatting";
import type { DistributionDatum } from "@/modules/analytics/types";

const STATUS_COLORS = ["#059669", "#2563eb", "#dc2626", "#64748b", "#7c3aed", "#b45309"];

export function PlatformAnalyticsPage() {
  usePageMeta({ title: "Platform Analytics", breadcrumb: ["Platform", "Analytics"] });
  const [params] = useSearchParams();
  const tenantFilter = params.get("tenant")?.toLowerCase();
  const { data, error, isLoading, refetch } = usePlatformAnalyticsQuery(true);
  const errorMessage = useMemo(() => error ? getErrorMessage(error, "Unable to load platform analytics.") : null, [error]);

  const statusData: DistributionDatum[] = data?.tenantStatusDistribution.map((item, index) => ({
    ...item,
    label: item.label === "Provisioning" ? "Pending setup" : item.label === "Inactive" ? "Deactivated" : item.label,
    color: STATUS_COLORS[index % STATUS_COLORS.length],
  })) ?? [];
  const roleData = data?.userRoleDistribution.map((item) => ({ label: item.label, value: item.value })) ?? [];
  const focusedTenant = data?.tenantHealth.find((tenant) => tenant.tenantKey.toLowerCase() === tenantFilter);

  const mostActive = useMemo(() => [...(data?.tenantHealth ?? [])]
    .filter((tenant) => tenant.lastActivityAt)
    .sort((a, b) => new Date(b.lastActivityAt ?? 0).getTime() - new Date(a.lastActivityAt ?? 0).getTime())
    .slice(0, 5), [data]);
  const leastActive = useMemo(() => [...(data?.tenantHealth ?? [])]
    .filter((tenant) => String(tenant.status).toUpperCase() !== "ARCHIVED")
    .sort((a, b) => new Date(a.lastActivityAt ?? 0).getTime() - new Date(b.lastActivityAt ?? 0).getTime())
    .slice(0, 5), [data]);

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Analytics" description={focusedTenant ? `Platform benchmarks with an operational focus on ${focusedTenant.companyName}.` : "SaaS-wide growth, adoption, identity activity, and business health."} />
      {errorMessage && <ErrorState message={errorMessage} onRetry={() => void refetch()} />}
      {isLoading && <SectionCard><LoadingSkeleton lines={12} className="h-80" /></SectionCard>}
      {!isLoading && !errorMessage && !data && <EmptyState title="No analytics available" description="Platform analytics data is unavailable right now." />}

      {!isLoading && !errorMessage && data ? (
        <>
          {focusedTenant ? (
            <SectionCard title={focusedTenant.companyName} subtitle={`Tenant focus · ${focusedTenant.tenantKey}`}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 font-bold text-purple-600">{focusedTenant.companyName[0]?.toUpperCase()}</span><div><p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{focusedTenant.adminName ?? "No administrator assigned"}</p><p className="text-xs" style={{ color: "var(--text-secondary)" }}>Last activity {formatRelativeTime(focusedTenant.lastActivityAt)}</p></div></div>
                <div className="flex items-center gap-3"><PlatformStatusBadge status={focusedTenant.status} /><Link to={`/platform/tenants/${focusedTenant.tenantKey}`} className="text-xs font-semibold text-purple-600 hover:underline">Open tenant profile →</Link></div>
              </div>
            </SectionCard>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={focusedTenant ? "Tenant employees" : "Avg. employees per tenant"} value={focusedTenant?.employeeCount ?? data.usage.averageEmployeesPerTenant} icon={<Users size={18} />} accentColor="#9332ea" />
            <StatCard label={focusedTenant ? "Tenant projects" : "Avg. projects per tenant"} value={focusedTenant?.projectCount ?? data.usage.averageProjectsPerTenant} icon={<BriefcaseBusiness size={18} />} accentColor="#2563eb" />
            <StatCard label={focusedTenant ? "Tenant teams" : "Avg. teams per tenant"} value={focusedTenant?.teamCount ?? data.usage.averageTeamsPerTenant} icon={<Building2 size={18} />} accentColor="#059669" />
            <StatCard label={focusedTenant ? "Tenant tasks" : "Avg. tasks per tenant"} value={focusedTenant?.taskCount ?? data.usage.averageTasksPerTenant} icon={<ListTodo size={18} />} accentColor="#d97706" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <PlatformTrendChart title="Company registration trend" subtitle="How quickly is the tenant portfolio growing?" data={data.tenantGrowthTrend} valueLabel="New companies" cumulativeLabel="Total companies" />
            <DonutChart title="Tenant lifecycle distribution" subtitle="What share of companies are active or need intervention?" data={statusData} drillDownTo="/platform/tenants" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <PlatformTrendChart title="Platform user growth" subtitle="Is the platform identity footprint increasing with tenant growth?" data={data.userGrowthTrend} valueLabel="New users" cumulativeLabel="Total users" />
            <PlatformTrendChart title="Recent login activity" subtitle="How many users recorded their latest login on each of the last 14 days?" data={data.loginActivityTrend} valueLabel="Users" color="#2563eb" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
            <BarChart title="User distribution" subtitle="Which roles make up the platform-wide user base?" data={roleData} color="#7c3aed" drillDownTo="/platform/users" />
            <SectionCard title="Data coverage" subtitle="Adoption averages use live tenant databases and exclude unavailable workspaces.">
              <div className="grid gap-3 sm:grid-cols-3">
                <CoverageMetric label="Tenants measured" value={data.usage.tenantsWithUsageAvailable} total={data.tenants.total} />
                <CoverageMetric label="Users active" value={data.users.active} total={data.users.total} />
                <CoverageMetric label="Logged in (7 days)" value={data.users.loggedInLastSevenDays} total={data.users.active} />
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <TenantActivityTable title="Most active companies" subtitle="Recently active workspaces indicate current platform adoption." tenants={mostActive} />
            <TenantActivityTable title="Companies needing attention" subtitle="The least recently active non-archived workspaces." tenants={leastActive} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function CoverageMetric({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)" }}>
      <CheckCircle2 size={18} className="mb-3 text-emerald-600" />
      <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{percentage}%</p>
      <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{label} · {value} of {total}</p>
    </div>
  );
}

function TenantActivityTable({ title, subtitle, tenants }: { title: string; subtitle: string; tenants: Array<{ tenantKey: string; companyName: string; status?: string; lastActivityAt?: string }> }) {
  return (
    <SectionCard title={title} subtitle={subtitle}>
      <div className="space-y-2">
        {tenants.map((tenant) => (
          <Link key={tenant.tenantKey} to={`/platform/tenants/${tenant.tenantKey}`} className="flex items-center gap-3 rounded-xl border p-3 no-underline transition-colors hover:bg-primary-50/40 dark:hover:bg-primary-950/20" style={{ borderColor: "var(--border-default)" }}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-purple-500/10 text-sm font-bold text-purple-600">{tenant.companyName[0]?.toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{tenant.companyName}</p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>{formatRelativeTime(tenant.lastActivityAt)}</p>
            </div>
            <PlatformStatusBadge status={tenant.status} />
          </Link>
        ))}
        {tenants.length === 0 ? <div className="flex items-center justify-center gap-2 py-10 text-sm" style={{ color: "var(--text-tertiary)" }}><Activity size={16} />No activity data available.</div> : null}
      </div>
    </SectionCard>
  );
}
