import { useEffect, useState } from "react";
import { Activity, BarChart3, Building2, ShieldAlert, TrendingUp } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getPlatformAnalyticsData } from "@/modules/analytics/services/analyticsService";
import { BarChart } from "@/modules/analytics/components/BarChart";
import { DonutChart } from "@/modules/analytics/components/DonutChart";
import { ErrorBanner, StatCard } from "@/components/common/AppUI";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import type { PlatformAnalyticsData } from "@/modules/analytics/types";

export function PlatformAnalyticsPage() {
  usePageMeta({ title: "Platform Analytics", breadcrumb: ["Platform", "Analytics"] });

  const [data, setData] = useState<PlatformAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const response = await getPlatformAnalyticsData();
      setData(response);
    } catch {
      setError("Unable to load platform analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics"
        description="Track tenant lifecycle, growth, and workspace status trends."
      />

      {error && <ErrorBanner message={error} onRetry={fetchData} />}

      {loading && (
        <SectionCard>
          <div className="h-60 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        </SectionCard>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total Tenants" value={data.totalTenants} icon={<Building2 size={18} />} accentColor="#9332EA" />
            <StatCard label="Active Tenants" value={data.activeTenants} icon={<Activity size={18} />} accentColor="#10b981" />
            <StatCard label="Suspended" value={data.suspendedTenants} icon={<ShieldAlert size={18} />} accentColor="#ef4444" />
            <StatCard label="New This Month" value={data.newlyAddedThisMonth} icon={<TrendingUp size={18} />} accentColor="#6366f1" />
            <StatCard label="Inactive" value={data.inactiveTenants} icon={<BarChart3 size={18} />} accentColor="#64748b" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DonutChart title="Tenant Status Distribution" data={data.tenantStatusDistribution} />
            <BarChart title="Tenant Growth by Month" data={data.tenantGrowthByMonth} color="#6366f1" />
          </div>
        </>
      )}
    </div>
  );
}
