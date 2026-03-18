import { useEffect, useState } from "react";
import { Activity, BarChart3, Building2, Settings, ShieldAlert, TrendingUp } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { getPlatformAnalyticsData } from "@/modules/analytics/services/analyticsService";
import { ErrorBanner, PageSection, QuickNavCard, StatCard } from "@/components/common/AppUI";
import { SectionCard } from "@/components/common/SectionCard";
import type { PlatformAnalyticsData } from "@/modules/analytics/types";

const PLATFORM_NAV = [
  { label: "Manage Tenants", description: "View and manage workspaces", icon: <Building2 size={18} />, to: "/platform/tenants", disabled: false },
  { label: "Analytics", description: "Platform-wide insights", icon: <BarChart3 size={18} />, to: "/platform/analytics", disabled: false },
  { label: "Settings", description: "Platform configuration", icon: <Settings size={18} />, to: "/platform/settings", disabled: false },
];

export function PlatformDashboardPage() {
  usePageMeta({ title: "Platform Dashboard", breadcrumb: ["Platform", "Dashboard"] });
  const { user } = useAuth();

  const [data, setData] = useState<PlatformAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDashboard() {
    setLoading(true);
    setError(null);
    try {
      const response = await getPlatformAnalyticsData();
      setData(response);
    } catch {
      setError("Could not load platform dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl border p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(147,50,234,0.12) 0%, rgba(84,22,140,0.06) 100%)",
          borderColor: "rgba(147,50,234,0.2)",
        }}
      >
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full blur-3xl opacity-20" style={{ background: "#9332EA" }} />
        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: "rgba(147,50,234,0.15)", color: "#c084fc", border: "1px solid rgba(147,50,234,0.25)" }}
          >
            <Activity size={11} />
            Platform Administration
          </div>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
            {user?.name ?? "Platform Admin"}
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Monitor tenant growth, workspace status, and platform configuration health.
          </p>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchDashboard} />}

      {loading && (
        <SectionCard>
          <div className="h-56 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        </SectionCard>
      )}

      {!loading && data && (
        <>
          <PageSection title="Platform Overview">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard label="Total Tenants" value={data.totalTenants} icon={<Building2 size={20} />} accentColor="#9332EA" />
              <StatCard label="Active Tenants" value={data.activeTenants} icon={<TrendingUp size={20} />} accentColor="#10b981" />
              <StatCard label="Suspended" value={data.suspendedTenants} icon={<ShieldAlert size={20} />} accentColor="#ef4444" />
              <StatCard label="Inactive" value={data.inactiveTenants} icon={<BarChart3 size={20} />} accentColor="#64748b" />
              <StatCard label="New This Month" value={data.newlyAddedThisMonth} icon={<Activity size={20} />} accentColor="#6366f1" />
            </div>
          </PageSection>

          <PageSection title="Platform Tools" description="Navigate to operational platform modules.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {PLATFORM_NAV.map((item) => (
                <QuickNavCard key={item.label} {...item} />
              ))}
            </div>
          </PageSection>
        </>
      )}
    </div>
  );
}
