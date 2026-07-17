import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2,
  ChevronDown, ChevronLeft, ChevronRight, X,
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
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
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
  collapsed,
  onMobileClose,
  tenantSlug,
}: {
  item: SidebarNavDef;
  collapsed: boolean;
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
        {!collapsed && (
          <span className="truncate">{item.label}</span>
        )}
        {!collapsed && (
          <span
            className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
          >
            Soon
          </span>
        )}
        {collapsed && (
          <div
            className="absolute left-full ml-2 px-2 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity"
            style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
          >
            {item.label} <span className="text-primary-400">(Soon)</span>
          </div>
        )}
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
          ? "linear-gradient(135deg, rgba(147,50,234,0.72) 0%, rgba(124,31,209,0.58) 100%)"
          : "transparent",
        color: isActive ? "white" : "rgba(255,255,255,0.72)",
        boxShadow: isActive ? "inset 0 0 0 1px rgba(255,255,255,0.08), 0 6px 16px rgba(15,8,32,0.18)" : undefined,
      })}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
      {/* Tooltip in collapsed mode */}
      {collapsed && (
        <div
          className="absolute left-full ml-2 px-2 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity"
          style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
        >
          {item.label}
        </div>
      )}
    </NavLink>
  );
}

function NavGroup({
  group,
  collapsed,
  onMobileClose,
  isFirst,
  tenantSlug,
}: {
  group: SidebarNavGroup;
  collapsed: boolean;
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
    <div className={collapsed ? "px-2 py-2" : "px-3.5 py-2"}>
      <Separator className="bg-white/10" decorative />
    </div>
  ) : null;

  if (group.collapsible) {
    if (collapsed) {
      const overviewItem = group.items[0];
      return (
        <div className="space-y-1">
          {separator}
          <NavItem
            item={{ ...overviewItem, label: group.label, icon: group.icon ?? overviewItem.icon }}
            collapsed
            onMobileClose={onMobileClose}
            tenantSlug={tenantSlug}
          />
        </div>
      );
    }

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
          style={{ background: containsActiveRoute ? "rgba(147,50,234,0.12)" : "transparent" }}
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
                collapsed={false}
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
          collapsed={collapsed}
          onMobileClose={onMobileClose}
          tenantSlug={tenantSlug}
        />
      ))}
    </div>
  );
}

export function AppSidebar({ area, collapsed, mobileOpen, onToggleCollapse, onMobileClose }: AppSidebarProps) {
  const { tenantKey } = useAuth();
  const { hasPermission } = usePermission();

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
        background: "linear-gradient(180deg, #160a27 0%, #12081f 44%, #0b0716 100%)",
        boxShadow: "16px 0 40px rgba(15, 8, 32, 0.18)",
      }}
    >
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/8 px-4">
        <div className="inline-flex items-center gap-2.5 min-w-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
            style={{
              background: "linear-gradient(135deg, #9332EA 0%, #c084fc 100%)",
              boxShadow: "0 4px 12px rgba(147,50,234,0.4)",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 6L7.5 18L12 10L16.5 18L20 6"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {!collapsed && (
            <span
              className="text-xl font-bold tracking-tight truncate"
              style={{
                background: "linear-gradient(135deg, #9332EA 0%, #a855f7 60%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              WorkNest
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
          {/* Desktop collapse */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors cursor-pointer"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-hide">
        {mainNavGroups.map((group, index) => (
          <NavGroup
            key={group.label}
            group={group}
            collapsed={collapsed}
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
        className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-[transform,width] duration-300 lg:relative lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-[5rem]" : "w-72"}`}
        style={{ height: "100vh" }}
        aria-label="Sidebar navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
