import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2,
  ChevronDown, X,
  ClipboardList, CalendarCheck, Bell, MessageSquare, Briefcase, BarChart3, CheckSquare, BellRing,
  Lock,
  FileText,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { type Permission, PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { tenantRoutes, platformRoutes } from "@/utils/tenantRoutes";
import { Separator } from "@/components/ui/separator";
import { WorkNestBrand } from "@/components/common/Logo";
import { useBranding } from "@/features/branding/useBranding";

interface SidebarNavDef {
  label: string;
  /** Can be a static path string or a function that resolves per-tenant slug. */
  to: string | ((tenantSlug: string) => string);
  icon: ReactNode;
  permission?: Permission;
}

interface SidebarNavGroup {
  label: string;
  items: SidebarNavDef[];
  collapsible?: boolean;
  icon?: ReactNode;
}

interface AppSidebarProps {
  area: "tenant" | "platform";
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/**
 * Sidebar navigation definitions.
 *
 * Paths are resolved per-tenant via functions so all links adapt
 * to the `/:tenant/...` routing structure instead of `/app/...`.
 */

const TENANT_NAV_GROUPS: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: (t: string) => tenantRoutes.dashboard(t), icon: <LayoutDashboard size={18} /> },
      { label: "Analytics", to: (t: string) => tenantRoutes.analytics(t), icon: <BarChart3 size={18} />, permission: PERMISSIONS.ANALYTICS_VIEW },
      { label: "Reports", to: (t: string) => tenantRoutes.reports(t), icon: <FileText size={18} />, permission: PERMISSIONS.REPORTS_VIEW },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Employees", to: (t: string) => tenantRoutes.employees(t), icon: <Users size={18} />, permission: PERMISSIONS.EMPLOYEES_VIEW },
      { label: "Teams", to: (t: string) => tenantRoutes.teams(t), icon: <Briefcase size={18} />, permission: PERMISSIONS.TEAMS_VIEW },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "Projects", to: (t: string) => tenantRoutes.projects(t), icon: <ClipboardList size={18} />, permission: PERMISSIONS.PROJECTS_VIEW },
      { label: "Tasks", to: (t: string) => tenantRoutes.tasks(t), icon: <CheckSquare size={18} />, permission: PERMISSIONS.TASKS_VIEW },
    ],
  },
  {
    label: "HR",
    items: [
      { label: "Attendance", to: (t: string) => tenantRoutes.attendance(t), icon: <CalendarCheck size={18} />, permission: PERMISSIONS.ATTENDANCE_VIEW },
      { label: "Leave", to: (t: string) => tenantRoutes.leave(t), icon: <CalendarCheck size={18} />, permission: PERMISSIONS.LEAVE_VIEW },
    ],
  },
  {
    label: "Recruitment",
    collapsible: true,
    icon: <Briefcase size={18} />,
    items: [
      { label: "Job Openings", to: (t: string) => tenantRoutes.recruitmentJobs(t), icon: <Briefcase size={18} />, permission: PERMISSIONS.RECRUITMENT_VIEW },
      { label: "Applications", to: (t: string) => tenantRoutes.recruitmentApplications(t), icon: <ClipboardList size={18} />, permission: PERMISSIONS.RECRUITMENT_VIEW },
      { label: "Email Templates", to: (t: string) => tenantRoutes.recruitmentEmailTemplates(t), icon: <Mail size={18} />, permission: PERMISSIONS.RECRUITMENT_VIEW },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Announcements", to: (t: string) => tenantRoutes.announcements(t), icon: <Bell size={18} />, permission: PERMISSIONS.ANNOUNCEMENTS_VIEW },
      { label: "Notifications", to: (t: string) => tenantRoutes.notifications(t), icon: <BellRing size={18} />, permission: PERMISSIONS.NOTIFICATIONS_VIEW },
      { label: "Chat", to: (t: string) => tenantRoutes.chat(t), icon: <MessageSquare size={18} />, permission: PERMISSIONS.CHAT_VIEW },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Audit Logs", to: (t: string) => tenantRoutes.auditLogs(t), icon: <Lock size={18} />, permission: PERMISSIONS.AUDIT_LOGS_VIEW },
    ],
  },
];

const PLATFORM_NAV_GROUPS: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: platformRoutes.dashboard(), icon: <LayoutDashboard size={18} /> },
      { label: "Analytics", to: platformRoutes.analytics(), icon: <BarChart3 size={18} />, permission: PERMISSIONS.PLATFORM_ANALYTICS_VIEW },
      { label: "Reports", to: platformRoutes.reports(), icon: <FileText size={18} />, permission: PERMISSIONS.PLATFORM_REPORTS_VIEW },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Tenants", to: platformRoutes.tenants(), icon: <Building2 size={18} />, permission: PERMISSIONS.PLATFORM_TENANTS_VIEW },
      { label: "Platform Users", to: platformRoutes.users(), icon: <Users size={18} />, permission: PERMISSIONS.PLATFORM_USERS_VIEW },
      { label: "Audit Logs", to: platformRoutes.auditLogs(), icon: <Lock size={18} />, permission: PERMISSIONS.PLATFORM_AUDIT_LOGS_VIEW },
    ],
  },
];

const COMING_SOON: string[] = [];

/**
 * Resolve a sidebar nav item's `to` value.
 * If it's a function, call it with the current tenant slug.
 * Otherwise return the static string as-is.
 */
function resolveNavTo(to: string | ((slug: string) => string), tenantSlug?: string): string {
  if (typeof to === "function") {
    return to(tenantSlug ?? "app");
  }
  return to;
}

function NavItem({
  item,
  onMobileClose,
  tenantSlug,
}: {
  item: SidebarNavDef;
  onMobileClose: () => void;
  tenantSlug?: string;
}) {
  const resolvedTo = resolveNavTo(item.to, tenantSlug);
  const isDisabled = COMING_SOON.includes(resolvedTo);

  const base =
    "group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";
  const active =
    "text-white";
  const inactive =
    "hover:text-white/90";

  if (isDisabled) {
    return (
      <div className={`${base} cursor-not-allowed opacity-50`} style={{ color: "var(--text-tertiary)" }}>
        <span className="shrink-0">{item.icon}</span>
        <span className="truncate">{item.label}</span>
        <span
          className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
        >
          Soon
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={resolvedTo}
      onClick={onMobileClose}
      end={resolvedTo === tenantRoutes.dashboard(tenantSlug)}
      className={({ isActive }) =>
        `${base} ${isActive ? active : inactive}`
      }
      style={({ isActive }) => ({
        background: isActive
          ? "linear-gradient(135deg, color-mix(in srgb, var(--brand-action) 78%, transparent) 0%, color-mix(in srgb, var(--brand-action-active) 66%, transparent) 100%)"
          : "transparent",
        color: isActive ? "white" : "rgba(255,255,255,0.72)",
        boxShadow: isActive ? "inset 0 0 0 1px rgba(255,255,255,0.08), 0 6px 16px rgba(15,8,32,0.18)" : undefined,
      })}
    >
      <span className="shrink-0">{item.icon}</span>
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

function NavGroup({
  group,
  onMobileClose,
  isFirst,
  tenantSlug,
}: {
  group: SidebarNavGroup;
  onMobileClose: () => void;
  isFirst: boolean;
  tenantSlug?: string;
}) {
  const location = useLocation();
  const containsActiveRoute = group.items.some((item) => {
    const path = resolveNavTo(item.to, tenantSlug);
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  });
  const [expansionOverride, setExpansionOverride] = useState<{ path: string; value: boolean } | null>(null);
  const expanded = expansionOverride?.path === location.pathname
    ? expansionOverride.value
    : containsActiveRoute;

  const separator = !isFirst ? (
    <div className="px-3.5 py-2">
      <Separator className="bg-white/10" decorative />
    </div>
  ) : null;

  if (group.collapsible) {
    const controlId = `sidebar-${group.label.toLowerCase().replace(/\s+/g, "-")}`;
    return (
      <div className="space-y-1">
        {separator}
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-white/80 transition-all duration-150 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35"
          onClick={() => setExpansionOverride({ path: location.pathname, value: !expanded })}
          aria-expanded={expanded}
          aria-controls={controlId}
          style={{ background: containsActiveRoute ? "color-mix(in srgb, var(--brand-action) 12%, transparent)" : "transparent" }}
        >
          <span className="shrink-0">{group.icon}</span>
          <span className="truncate">{group.label}</span>
          <ChevronDown className={`ml-auto shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} size={16} />
        </button>
        <div
          id={controlId}
          className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-60"}`}
        >
          <div className="min-h-0 space-y-1 overflow-hidden pl-2">
            {group.items.map((item) => (
              <NavItem
                key={typeof item.to === "function" ? item.label : item.to}
                item={item}
                onMobileClose={onMobileClose}
                tenantSlug={tenantSlug}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {separator}
      {group.items.map((item) => (
        <NavItem
          key={typeof item.to === "function" ? item.label : item.to}
          item={item}
          onMobileClose={onMobileClose}
          tenantSlug={tenantSlug}
        />
      ))}
    </div>
  );
}

export function AppSidebar({ area, mobileOpen, onMobileClose }: AppSidebarProps) {
  const { tenantKey } = useAuth();
  const { hasPermission } = usePermission();
  const { branding } = useBranding();

  const resolvedTenantSlug = tenantKey ?? "app";

  const sourceGroups = area === "tenant" ? TENANT_NAV_GROUPS : PLATFORM_NAV_GROUPS;
  const mainNavGroups = sourceGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
      }))
      .filter((group) => group.items.length > 0);

  const sidebarContent = (
    <div
      className="relative flex h-full flex-col"
      style={{
        background: "linear-gradient(180deg, color-mix(in srgb, var(--color-primary-950) 54%, #080b14) 0%, color-mix(in srgb, var(--color-primary-950) 32%, #080b14) 44%, #080b14 100%)",
        boxShadow: "16px 0 40px rgba(15, 8, 32, 0.18)",
      }}
    >
      {/* Header */}
      <div className="flex min-h-20 shrink-0 items-center justify-between gap-3 border-b border-white/8 px-5 py-4" style={{ borderBottomColor: "color-mix(in srgb, var(--brand-action) 50%, transparent)" }}>
        <div className="min-w-0 flex-1">
          {area === "tenant" ? (
            <div
              className="whitespace-normal break-words text-xl font-extrabold leading-tight tracking-tight"
              style={{ color: "var(--color-primary-100)" }}
            >
              {branding.companyName}
            </div>
          ) : (
            <WorkNestBrand size="sm" />
          )}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-hide">
        {mainNavGroups.map((group, index) => (
          <NavGroup
            key={group.label}
            group={group}
            onMobileClose={onMobileClose}
            isFirst={index === 0}
            tenantSlug={resolvedTenantSlug}
          />
        ))}
      </nav>

    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ height: "100vh" }}
        aria-label="Sidebar navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
