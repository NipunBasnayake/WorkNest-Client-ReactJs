import { useMemo } from "react";
import { Activity, Archive, Building2, Clock3, ShieldAlert, TrendingUp, UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformDashboardQuery } from "@/hooks/queries/usePlatformQueries";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/AsyncStates";
import { PageSection, StatCard } from "@/components/common/AppUI";
import { SectionCard } from "@/components/common/SectionCard";
import { getErrorMessage } from "@/utils/errorHandler";
import { formatRelativeTime, getDaytimeGreeting } from "@/utils/formatting";
import { DonutChart } from "@/modules/analytics/components/DonutChart";
import { InsightPanel } from "@/modules/analytics/components/InsightPanel";
import { PlatformTrendChart } from "@/modules/platform/components/PlatformTrendChart";
import { PlatformStatusBadge } from "@/modules/platform/components/PlatformStatusBadge";
import type { BusinessInsight, DistributionDatum } from "@/modules/analytics/types";

const STATUS_COLORS: Record<string, string> = {
  Active: "#059669",
  "Pending Setup": "#2563eb",
  Suspended: "#dc2626",
  Deactivated: "#64748b",
  Archived: "#7c3aed",
  Rejected: "#b45309",
};

export function PlatformDashboardPage() {
  usePageMeta({ title: "SaaS Operations", breadcrumb: ["Platform", "Operations"] });
  const { user } = useAuth();
  const { data, error, isLoading, refetch } = usePlatformDashboardQuery(true);
  const errorMessage = useMemo(
    () => (error ? getErrorMessage(error, "Could not load platform operations data.") : null),
    [error]
  );

  const insights = useMemo<BusinessInsight[]>(() => {
    if (!data) return [];
    const inactiveOverThirtyDays = data.tenantHealth.filter((tenant) => {
      if (!tenant.lastActivityAt || String(tenant.status).toUpperCase() === "ARCHIVED") return false;
      return new Date(data.generatedAt).getTime() - new Date(tenant.lastActivityAt).getTime() > 30 * 24 * 60 * 60 * 1000;
    }).length;
    const attentionCount = data.tenants.suspended + data.tenants.inactive + data.tenants.pending;
    return [
      data.tenants.newThisMonth > 0
        ? { id: "growth", severity: "positive", title: `${data.tenants.newThisMonth} new ${data.tenants.newThisMonth === 1 ? "company" : "companies"} joined this month`, description: data.tenants.growthPercent == null ? "This is the first recorded growth in the comparison period." : `Tenant acquisition changed ${Math.abs(data.tenants.growthPercent)}% compared with last month.`, actionTo: "/platform/analytics" }
        : { id: "growth", severity: "info", title: "No new companies this month", description: "Tenant acquisition is flat in the current calendar month.", actionTo: "/platform/analytics" },
      attentionCount > 0
        ? { id: "attention", severity: "warning", title: `${attentionCount} ${attentionCount === 1 ? "tenant requires" : "tenants require"} administrator attention`, description: "Pending setup, suspension, and deactivation states should be reviewed.", actionTo: "/platform/tenants" }
        : { id: "attention", severity: "positive", title: "No lifecycle exceptions", description: "Every registered tenant is currently active or intentionally archived." },
      inactiveOverThirtyDays > 0
        ? { id: "inactivity", severity: "warning", title: `${inactiveOverThirtyDays} ${inactiveOverThirtyDays === 1 ? "company has" : "companies have"} been inactive for over 30 days`, description: "Review adoption or contact the tenant administrator.", actionTo: "/platform/tenants" }
        : { id: "inactivity", severity: "positive", title: "Tenant activity is current", description: "No measurable tenant has crossed the 30-day inactivity threshold." },
      data.users.tenantAdminsInactiveThirtyDays > 0
        ? { id: "admins", severity: "critical", title: `${data.users.tenantAdminsInactiveThirtyDays} tenant ${data.users.tenantAdminsInactiveThirtyDays === 1 ? "admin has" : "admins have"} not logged in recently`, description: "Tenant administrators with no login in 30 days may need onboarding support.", actionTo: "/platform/users" }
        : { id: "admins", severity: "positive", title: "Tenant administrators are engaged", description: "Every tenant administrator has logged in during the last 30 days." },
    ];
  }, [data]);

  const statusData: DistributionDatum[] = data?.tenantStatusDistribution.map((item) => ({
    ...item,
    label: item.label === "Provisioning" ? "Pending setup" : item.label === "Inactive" ? "Deactivated" : item.label,
    color: STATUS_COLORS[item.label === "Provisioning" ? "Pending Setup" : item.label === "Inactive" ? "Deactivated" : item.label] ?? "#9332ea",
  })) ?? [];

  return (
    <div className="space-y-6">
      <div
        className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", borderTop: "3px solid var(--color-primary-500)" }}
      >
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{getDaytimeGreeting()}</p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>{user?.name ?? "Platform Admin"}</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>SaaS operations overview for platform health, growth, adoption, and tenant attention.</p>
          </div>
          {data ? <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Updated {formatRelativeTime(data.generatedAt)}</p> : null}
        </div>
      </div>

      {errorMessage && <ErrorState message={errorMessage} onRetry={() => void refetch()} />}
      {isLoading && <SectionCard><LoadingSkeleton lines={10} className="h-72" /></SectionCard>}
      {!isLoading && !errorMessage && !data && <EmptyState title="No operations data" description="Platform operations metrics are unavailable right now." />}

      {!isLoading && !errorMessage && data ? (
        <>
          <PageSection title="Platform overview" description="Current company lifecycle across the WorkNest platform.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard label="Total tenants" value={data.tenants.total} icon={<Building2 size={20} />} accentColor="#9332ea" trend={data.tenants.growthPercent == null ? undefined : { value: data.tenants.growthPercent, label: "vs last month" }} />
              <StatCard label="Active tenants" value={data.tenants.active} icon={<TrendingUp size={20} />} accentColor="#059669" />
              <StatCard label="Suspended" value={data.tenants.suspended} icon={<ShieldAlert size={20} />} accentColor="#dc2626" />
              <StatCard label="Pending setup" value={data.tenants.pending} icon={<Clock3 size={20} />} accentColor="#2563eb" />
              <StatCard label="Archived" value={data.tenants.archived} icon={<Archive size={20} />} accentColor="#7c3aed" />
            </div>
          </PageSection>

          <PageSection title="Platform users" description="Identity growth and current authenticated usage.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total users" value={data.users.total} icon={<Users size={20} />} accentColor="#9332ea" />
              <StatCard label="Active users" value={data.users.active} icon={<Activity size={20} />} accentColor="#059669" />
              <StatCard label="New users today" value={data.users.newToday} icon={<UserPlus size={20} />} accentColor="#2563eb" />
              <StatCard label="New users this month" value={data.users.newThisMonth} icon={<UserPlus size={20} />} accentColor="#7c3aed" />
            </div>
          </PageSection>

          <PageSection title="Operational activity" description="Current authenticated usage and recorded platform administration.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Active sessions" value={data.users.activeSessions} icon={<Clock3 size={20} />} accentColor="#d97706" />
              <StatCard label="Users logged in (7 days)" value={data.users.loggedInLastSevenDays} icon={<Activity size={20} />} accentColor="#2563eb" />
              <StatCard label="Platform audit events" value={data.usage.platformAuditEvents} icon={<ShieldAlert size={20} />} accentColor="#9332ea" />
            </div>
          </PageSection>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
            <PlatformTrendChart title="Tenant growth" subtitle="New companies and cumulative platform footprint over the last 12 months" data={data.tenantGrowthTrend} valueLabel="New companies" cumulativeLabel="Total companies" compact />
            <DonutChart title="Tenant portfolio health" subtitle="Current lifecycle status distribution" data={statusData} drillDownTo="/platform/tenants" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
            <InsightPanel insights={insights} />
            <SectionCard title="Recent platform events" subtitle="Latest administrator-driven tenant lifecycle changes.">
              <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
                {data.recentAuditEvents.slice(0, 6).map((event) => (
                  <div key={event.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <Link to={`/platform/tenants/${event.tenantKey}`} className="truncate text-sm font-semibold text-purple-600 hover:underline">{event.companyName ?? event.tenantKey}</Link>
                      <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-secondary)" }}>{event.actorEmail} changed the lifecycle status</p>
                    </div>
                    <div className="text-right">
                      <PlatformStatusBadge status={event.newStatus} />
                      <p className="mt-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>{formatRelativeTime(event.occurredAt)}</p>
                    </div>
                  </div>
                ))}
                {data.recentAuditEvents.length === 0 ? <p className="py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>No platform lifecycle events have been recorded.</p> : null}
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}
    </div>
  );
}
