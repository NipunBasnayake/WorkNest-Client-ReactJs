import { useEffect, useState } from "react";
import { Users, CheckSquare, FolderOpen, CalendarClock, Briefcase, Bell, Settings, UserCheck } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { getTenantInfoApi } from "@/services/api/employeeApi";
import { StatCard, PageSection, QuickNavCard, ErrorBanner } from "@/components/common/AppUI";

const NAV_CARDS = [
  { label: "Employees",     description: "Manage team members",          icon: <Users size={18} />,         to: "/app/employees",     disabled: false },
  { label: "Teams",         description: "Configure team structures",     icon: <Briefcase size={18} />,     to: "/app/teams",         disabled: true },
  { label: "Projects",      description: "Track ongoing projects",        icon: <FolderOpen size={18} />,    to: "/app/projects",      disabled: true },
  { label: "Attendance",    description: "Daily check-in logs",           icon: <CalendarClock size={18} />, to: "/app/attendance",    disabled: true },
  { label: "Announcements", description: "Company-wide communications",   icon: <Bell size={18} />,          to: "/app/announcements", disabled: true },
  { label: "Settings",      description: "Workspace configuration",       icon: <Settings size={18} />,      to: "/app/settings",      disabled: false },
];

export function TenantDashboardPage() {
  usePageMeta({ title: "Dashboard", breadcrumb: ["Workspace", "Dashboard"] });
  const { user, tenantKey } = useAuth();

  const [tenantInfo, setTenantInfo]   = useState<Record<string, unknown> | null>(null);
  const [infoError,  setInfoError]    = useState<string | null>(null);

  useEffect(() => {
    getTenantInfoApi()
      .then(setTenantInfo)
      .catch(() => setInfoError("Could not load workspace info."));
  }, []);

  const greeting = getGreeting();

  return (
    <div>
      {/* Welcome */}
      <div
        className="rounded-2xl p-6 sm:p-8 mb-8 border relative overflow-hidden"
        style={{
          background:   "linear-gradient(135deg, rgba(147,50,234,0.1) 0%, rgba(124,31,209,0.05) 100%)",
          borderColor:  "rgba(147,50,234,0.2)",
        }}
      >
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: "#9332EA" }} />
        <div className="relative z-10">
          <p className="text-sm font-medium mb-1" style={{ color: "var(--color-primary-600)" }}>
            {greeting}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            {user?.name ?? "Team Member"} 👋
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            You&apos;re logged into workspace{" "}
            <span
              className="font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(147,50,234,0.12)", color: "var(--color-primary-600)" }}
            >
              {tenantKey ?? "—"}
            </span>
            {" "}· Role:{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {user?.role}
            </span>
          </p>
        </div>
      </div>

      {/* Tenant info */}
      {infoError && <ErrorBanner message={infoError} onRetry={() => { setInfoError(null); getTenantInfoApi().then(setTenantInfo).catch(() => setInfoError("Could not load workspace info.")); }} />}
      {tenantInfo && (
        <div
          className="mb-6 rounded-xl px-4 py-3 border text-sm flex flex-wrap gap-4"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
        >
          {Object.entries(tenantInfo).slice(0, 5).map(([k, v]) => (
            <span key={k} style={{ color: "var(--text-secondary)" }}>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{k}:</span>{" "}
              {String(v ?? "—")}
            </span>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <PageSection title="Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Employees"     value="—" icon={<Users size={20} />}        accentColor="#9332EA" />
          <StatCard label="Active Tasks"  value="—" icon={<CheckSquare size={20} />}  accentColor="#7c3aed" />
          <StatCard label="Projects"      value="—" icon={<FolderOpen size={20} />}   accentColor="#6d28d9" />
          <StatCard label="Present Today" value="—" icon={<UserCheck size={20} />}    accentColor="#5b21b6" />
        </div>
      </PageSection>

      {/* Quick nav */}
      <PageSection title="Quick Access" description="Jump to any module from here.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {NAV_CARDS.map((card) => (
            <QuickNavCard key={card.label} {...card} />
          ))}
        </div>
      </PageSection>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  return "Good evening,";
}
