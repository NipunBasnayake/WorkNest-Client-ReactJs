import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, User, Settings, Building2,
  LogOut, ChevronLeft, ChevronRight, X,
  ClipboardList, CalendarCheck, Bell, MessageSquare, Briefcase, BarChart3, CheckSquare, BellRing,
  Lock,
} from "lucide-react";
import { FaUser } from "react-icons/fa6";
import { useAuth } from "@/hooks/useAuth";
import { type Permission, PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { tenantRoutes, platformRoutes } from "@/utils/tenantRoutes";

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
      { label: "Recruitment", to: (t: string) => tenantRoutes.recruitment(t), icon: <ClipboardList size={18} />, permission: PERMISSIONS.RECRUITMENT_VIEW },
      { label: "Attendance", to: (t: string) => tenantRoutes.attendance(t), icon: <CalendarCheck size={18} />, permission: PERMISSIONS.ATTENDANCE_VIEW },
      { label: "Leave", to: (t: string) => tenantRoutes.leave(t), icon: <CalendarCheck size={18} />, permission: PERMISSIONS.LEAVE_VIEW },
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
];

const PLATFORM_NAV_GROUPS: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: platformRoutes.dashboard(), icon: <LayoutDashboard size={18} /> },
      { label: "Analytics", to: platformRoutes.analytics(), icon: <BarChart3 size={18} /> },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Tenants", to: platformRoutes.tenants(), icon: <Building2 size={18} /> },
      { label: "Settings", to: platformRoutes.settings(), icon: <Settings size={18} /> },
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
    "group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150";
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
  return (
    <div className={isFirst ? "space-y-1" : "space-y-1 pt-2"}>
      {!collapsed && (
        <div
          className="px-3.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "rgba(255,255,255,0.42)" }}
        >
          {group.label}
        </div>
      )}
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

/* ── Account dropdown submenu ── */

interface AccountDropdownMenuProps {
  collapsed: boolean;
  onItemClick: () => void;
  onLogout: () => Promise<void> | void;
}

function AccountDropdownMenu({ collapsed, onItemClick, onLogout }: AccountDropdownMenuProps) {
  const navigate = useNavigate();

  return (
    <div
      className={`${collapsed ? "absolute left-full ml-2 top-0" : "relative mt-1"} w-48 rounded-xl border py-1 shadow-xl z-50`}
      style={{
        backgroundColor: "#1a0f2e",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
      role="menu"
      aria-label="Account menu"
    >
      {ACCOUNT_DROPDOWN_ITEMS.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => {
            navigate(item.getTo());
            onItemClick();
          }}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-white/8"
          style={{ color: "rgba(255,255,255,0.72)" }}
          role="menuitem"
        >
          {item.icon}
          {item.label}
        </button>
      ))}
      <div className="mx-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
      <button
        type="button"
        onClick={async () => {
          onItemClick();
          await onLogout();
          /* Navigation to /login is handled by handleLogout passed as onLogout */
        }}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-red-500/15 hover:text-red-300"
        style={{ color: "rgba(255,255,255,0.45)" }}
        role="menuitem"
      >
        <LogOut size={15} />
        Log out
      </button>
    </div>
  );
}

/* ── Sidebar component ── */

const ACCOUNT_DROPDOWN_ITEMS: {
  label: string;
  icon: ReactNode;
  getTo: () => string;
}[] = [
  { label: "Profile", icon: <User size={15} />, getTo: () => tenantRoutes.profile() },
  { label: "Settings", icon: <Settings size={15} />, getTo: () => tenantRoutes.settings() },
  { label: "Security", icon: <Lock size={15} />, getTo: () => tenantRoutes.settingsSecurity() },
];

export function AppSidebar({ area, collapsed, mobileOpen, onToggleCollapse, onMobileClose }: AppSidebarProps) {
  const { user, logout, role, tenantKey } = useAuth();
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const resolvedTenantSlug = tenantKey ?? "app";

  const mainNavGroups = area === "tenant"
    ? TENANT_NAV_GROUPS
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
      }))
      .filter((group) => group.items.length > 0)
    : PLATFORM_NAV_GROUPS;

  /* ── Close account menu on outside click ── */
  useEffect(() => {
    if (!accountMenuOpen) return;

    function handleClick(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setAccountMenuOpen(false);
    }

    // Delay listener registration to avoid the same click that opened it
    const raf = requestAnimationFrame(() => {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleEscape);
    });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [accountMenuOpen]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const sidebarContent = (
    <div
      className="flex flex-col h-full relative"
      style={{
        background: "linear-gradient(180deg, #180a29 0%, #12081f 38%, #0b0716 100%)",
        boxShadow: "16px 0 40px rgba(15, 8, 32, 0.18)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 shrink-0 border-b border-white/8">
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
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-hide">
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

      {/* Divider */}
      <div className="mx-3 border-t border-white/8" />

      {/* Account section with dropdown submenu */}
      {user && (
        <div className="px-3 py-3 space-y-1" ref={accountMenuRef}>
          {!collapsed && (
            <div
              className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,0.42)" }}
            >
              Account
            </div>
          )}

          {/* Clickable user card that toggles the dropdown */}
          <button
            type="button"
            onClick={() => setAccountMenuOpen((prev) => !prev)}
            className={`flex w-full items-center gap-3 rounded-xl border border-white/8 text-left transition-all duration-150 ${
              collapsed ? "px-2 py-2 justify-center" : "px-3 py-2.5"
            } ${accountMenuOpen ? "bg-white/10" : "hover:bg-white/6"}`}
            style={{ background: accountMenuOpen ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)" }}
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            title={collapsed ? user.name : undefined}
          >
            {collapsed ? (
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white"
                    style={{ backgroundColor: "#6b7280" }}
                  >
                    <FaUser size={12} />
                  </div>
                )}
                {/* Dropdown in collapsed mode appears to the right */}
                {accountMenuOpen && (
                  <div className="absolute left-full ml-2 top-0">
                    <AccountDropdownMenu collapsed onItemClick={() => setAccountMenuOpen(false)} onLogout={handleLogout} />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex w-full items-center gap-2.5">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white"
                    style={{ backgroundColor: "#6b7280" }}
                  >
                    <FaUser size={12} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white/90 truncate">{user.name}</div>
                  <div className="text-[10px] text-white/40 truncate">{user.email}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/30 truncate">{role ?? "workspace"}</div>
                </div>
                {/* Chevron indicator */}
                <ChevronRight
                  size={14}
                  className={`shrink-0 transition-transform duration-200 ${accountMenuOpen ? "rotate-90" : ""}`}
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
              </div>
            )}
          </button>

          {/* Dropdown menu in expanded mode */}
          {accountMenuOpen && !collapsed && (
            <AccountDropdownMenu collapsed={false} onItemClick={() => setAccountMenuOpen(false)} onLogout={handleLogout} />
          )}
        </div>
      )}

      {/* Direct logout button at the very bottom (always visible shortcut) */}
      <div className="px-3 pb-3">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium transition-colors cursor-pointer hover:bg-red-500/15 hover:text-red-300 group relative`}
          style={{ color: "rgba(255,255,255,0.45)" }}
          title="Log out"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Log out</span>}
          {collapsed && (
            <div
              className="absolute left-full ml-2 px-2 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity"
              style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
            >
              Log out
            </div>
          )}
        </button>
      </div>
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
        className={`fixed lg:relative inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 lg:translate-x-0 ${
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
