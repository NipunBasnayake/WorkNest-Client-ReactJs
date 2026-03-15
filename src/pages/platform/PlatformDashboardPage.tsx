import { useEffect, useState } from "react";
import { Building2, Users, BarChart3, Activity } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { getTenantsApi } from "@/services/api/platformApi";
import { StatCard, PageSection, QuickNavCard, ErrorBanner } from "@/components/common/AppUI";

const PLATFORM_NAV = [
  { label: "Manage Tenants",    description: "View and manage workspaces",     icon: <Building2 size={18} />,   to: "/platform/tenants",   disabled: false },
  { label: "Analytics",         description: "Platform-wide usage analytics",  icon: <BarChart3 size={18} />,   to: "/platform/analytics", disabled: true },
];

export function PlatformDashboardPage() {
  usePageMeta({ title: "Platform Dashboard", breadcrumb: ["Platform", "Dashboard"] });
  const { user } = useAuth();

  const [tenantCount, setTenantCount] = useState<number | null>(null);
  const [statsError,  setStatsError]  = useState<string | null>(null);

  useEffect(() => {
    getTenantsApi()
      .then((t) => setTenantCount(t.length))
      .catch(() => setStatsError("Could not load platform stats."));
  }, []);

  return (
    <div>
      {/* Welcome hero */}
      <div
        className="rounded-2xl p-6 sm:p-8 mb-8 border relative overflow-hidden"
        style={{
          background:  "linear-gradient(135deg, rgba(147,50,234,0.12) 0%, rgba(84,22,140,0.06) 100%)",
          borderColor: "rgba(147,50,234,0.2)",
        }}
      >
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full blur-3xl opacity-15" style={{ background: "#9332EA" }} />
        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
            style={{ background: "rgba(147,50,234,0.15)", color: "#c084fc", border: "1px solid rgba(147,50,234,0.25)" }}
          >
            <Activity size={11} />
            Platform Administration
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Welcome, {user?.name ?? "Platform Admin"} 👋
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            You are signed in as{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{user?.role}</span>
            . Manage tenant workspaces and platform settings from here.
          </p>
        </div>
      </div>

      {statsError && <div className="mb-6"><ErrorBanner message={statsError} /></div>}

      {/* Stats */}
      <PageSection title="Platform Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Tenants"
            value={tenantCount ?? "—"}
            icon={<Building2 size={20} />}
            accentColor="#9332EA"
          />
          <StatCard label="Total Users"        value="—" icon={<Users size={20} />}   accentColor="#7c1fd1" />
          <StatCard label="Platform Uptime"    value="99.9%" icon={<Activity size={20} />}  accentColor="#6d28d9" />
          <StatCard label="API Requests Today" value="—"   icon={<BarChart3 size={20} />} accentColor="#5b21b6" />
        </div>
      </PageSection>

      {/* Quick access */}
      <PageSection title="Platform Tools" description="Manage your platform workspace.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORM_NAV.map((card) => (
            <QuickNavCard key={card.label} {...card} />
          ))}
        </div>
      </PageSection>
    </div>
  );
}
