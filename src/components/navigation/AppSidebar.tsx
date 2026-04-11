import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, User, Settings, Building2,
  LogOut, ChevronLeft, ChevronRight, X,
  ClipboardList, CalendarCheck, Bell, MessageSquare, Briefcase, BarChart3, CheckSquare, BellRing,
} from "lucide-react";
import { FaUser } from "react-icons/fa6";
import { useAuth } from "@/hooks/useAuth";
import { type Permission, PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";

interface SidebarNavDef {
  label: string;
  to: string;
  icon: React.ReactNode;
  permission?: Permission;
}

interface AppSidebarProps {
  area: "tenant" | "platform";
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
}

const TENANT_NAV: SidebarNavDef[] = [
  { label: "Dashboard",     to: "/app/dashboard",     icon: <LayoutDashboard size={18} /> },
  { label: "Employees",     to: "/app/employees",     icon: <Users size={18} />, permission: PERMISSIONS.EMPLOYEES_VIEW },
  { label: "Teams",         to: "/app/teams",         icon: <Briefcase size={18} />, permission: PERMISSIONS.TEAMS_VIEW },
  { label: "Projects",      to: "/app/projects",      icon: <ClipboardList size={18} />, permission: PERMISSIONS.PROJECTS_VIEW },
  { label: "Tasks",         to: "/app/tasks",         icon: <CheckSquare size={18} />, permission: PERMISSIONS.TASKS_VIEW },
  { label: "Analytics",     to: "/app/analytics",     icon: <BarChart3 size={18} />, permission: PERMISSIONS.ANALYTICS_VIEW },
  { label: "Attendance",    to: "/app/attendance",    icon: <CalendarCheck size={18} />, permission: PERMISSIONS.ATTENDANCE_VIEW },
  { label: "Leave",         to: "/app/leave",         icon: <CalendarCheck size={18} />, permission: PERMISSIONS.LEAVE_VIEW },
  { label: "Announcements", to: "/app/announcements", icon: <Bell size={18} />, permission: PERMISSIONS.ANNOUNCEMENTS_VIEW },
  { label: "Notifications", to: "/app/notifications", icon: <BellRing size={18} />, permission: PERMISSIONS.NOTIFICATIONS_VIEW },
  { label: "Chat",          to: "/app/chat",          icon: <MessageSquare size={18} />, permission: PERMISSIONS.CHAT_VIEW },
];

const PLATFORM_NAV: SidebarNavDef[] = [
  { label: "Dashboard", to: "/platform/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Tenants",   to: "/platform/tenants",   icon: <Building2 size={18} /> },
  { label: "Analytics", to: "/platform/analytics", icon: <BarChart3 size={18} /> },
  { label: "Settings",  to: "/platform/settings",  icon: <Settings size={18} /> },
];

const BOTTOM_NAV_TENANT: SidebarNavDef[] = [
  { label: "Profile",  to: "/app/profile",  icon: <User size={18} /> },
  { label: "Settings", to: "/app/settings", icon: <Settings size={18} /> },
];

const BOTTOM_NAV_PLATFORM: SidebarNavDef[] = [
  { label: "Profile", to: "/platform/profile", icon: <User size={18} /> },
];

const COMING_SOON: string[] = [];

function NavItem({
  item,
  collapsed,
  onMobileClose,
}: {
  item: SidebarNavDef;
  collapsed: boolean;
  onMobileClose: () => void;
}) {
  const isDisabled = COMING_SOON.includes(item.to);

  const base =
    "group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-150";
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
      to={item.to}
      onClick={onMobileClose}
      className={({ isActive }) =>
        `${base} ${isActive ? active : inactive}`
      }
      style={({ isActive }) => ({
        background: isActive
          ? "linear-gradient(135deg, rgba(147,50,234,0.88) 0%, rgba(124,31,209,0.78) 100%)"
          : "transparent",
        color: isActive ? "white" : "rgba(255,255,255,0.6)",
        boxShadow: isActive ? "0 4px 12px rgba(147,50,234,0.3)" : undefined,
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

export function AppSidebar({ area, collapsed, mobileOpen, onToggleCollapse, onMobileClose }: AppSidebarProps) {
  const { user, logout, role } = useAuth();
  const { hasPermission } = usePermission();
  const navigate = useNavigate();

  const mainNav   = area === "tenant" ? TENANT_NAV.filter((item) => !item.permission || hasPermission(item.permission)) : PLATFORM_NAV;
  const bottomNav = area === "tenant" ? BOTTOM_NAV_TENANT : BOTTOM_NAV_PLATFORM;

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
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-hide">
        {mainNav.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} onMobileClose={onMobileClose} />
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-white/8" />

      {/* Bottom nav */}
      <div className="px-3 py-3 space-y-0.5">
        {bottomNav.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} onMobileClose={onMobileClose} />
        ))}

        {/* Logout */}
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

      {/* User info */}
      {user && (
        <div
          className={`mx-3 mb-3 rounded-xl border border-white/8 ${collapsed ? "px-2 py-2" : "px-3 py-2.5"}`}
          style={{ background: "rgba(255,255,255,0.04)" }}
          title={collapsed ? user.name : undefined}
        >
          {collapsed ? (
            <div className="flex items-center justify-center">
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
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
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
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white/90 truncate">{user.name}</div>
                <div className="text-[10px] text-white/40 truncate">{user.email}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/30 truncate">{role ?? "workspace"}</div>
              </div>
            </div>
          )}
        </div>
      )}
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
      >
        {sidebarContent}
      </aside>
    </>
  );
}
