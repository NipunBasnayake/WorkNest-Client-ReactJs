import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, User, Settings, Building2,
  LogOut, ChevronLeft, ChevronRight, X,
  ClipboardList, CalendarCheck, Bell, MessageSquare, Briefcase, BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/common/Logo";

interface SidebarNavDef {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles?: string[];
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
  { label: "Employees",     to: "/app/employees",     icon: <Users size={18} /> },
  { label: "Teams",         to: "/app/teams",         icon: <Briefcase size={18} /> },
  { label: "Projects",      to: "/app/projects",      icon: <ClipboardList size={18} /> },
  { label: "Attendance",    to: "/app/attendance",    icon: <CalendarCheck size={18} /> },
  { label: "Leave",         to: "/app/leave",         icon: <CalendarCheck size={18} /> },
  { label: "Announcements", to: "/app/announcements", icon: <Bell size={18} /> },
  { label: "Messages",      to: "/app/messages",      icon: <MessageSquare size={18} /> },
];

const PLATFORM_NAV: SidebarNavDef[] = [
  { label: "Dashboard", to: "/platform/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Tenants",   to: "/platform/tenants",   icon: <Building2 size={18} /> },
  { label: "Analytics", to: "/platform/analytics", icon: <BarChart3 size={18} /> },
];

const BOTTOM_NAV_TENANT: SidebarNavDef[] = [
  { label: "Profile",  to: "/app/profile",  icon: <User size={18} /> },
  { label: "Settings", to: "/app/settings", icon: <Settings size={18} /> },
];

const BOTTOM_NAV_PLATFORM: SidebarNavDef[] = [
  { label: "Profile", to: "/platform/profile", icon: <User size={18} /> },
];

const COMING_SOON = ["/app/teams", "/app/projects", "/app/attendance", "/app/leave", "/app/announcements", "/app/messages", "/platform/analytics"];

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
    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative";
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
          ? "linear-gradient(135deg, rgba(147,50,234,0.85) 0%, rgba(124,31,209,0.75) 100%)"
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const mainNav   = area === "tenant" ? TENANT_NAV : PLATFORM_NAV;
  const bottomNav = area === "tenant" ? BOTTOM_NAV_TENANT : BOTTOM_NAV_PLATFORM;

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const sidebarContent = (
    <div
      className="flex flex-col h-full relative"
      style={{
        background: "linear-gradient(180deg, #1a0a2e 0%, #120820 50%, #0d0616 100%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 shrink-0 border-b border-white/8">
        {!collapsed && <Logo size="md" />}
        {collapsed && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)" }}
          >
            <span className="text-white font-bold text-sm">W</span>
          </div>
        )}
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

      {/* Session badge */}
      {!collapsed && (
        <div className="px-4 pt-3 pb-1">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: area === "platform" ? "rgba(147,50,234,0.25)" : "rgba(99,102,241,0.2)",
              color: area === "platform" ? "#c084fc" : "#a5b4fc",
              border: `1px solid ${area === "platform" ? "rgba(147,50,234,0.3)" : "rgba(99,102,241,0.25)"}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: area === "platform" ? "#c084fc" : "#a5b4fc" }}
            />
            {area === "platform" ? "Platform Admin" : "Workspace"}
          </div>
        </div>
      )}

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
      {!collapsed && user && (
        <div
          className="mx-3 mb-3 px-3 py-2.5 rounded-xl border border-white/8"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)" }}
            >
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white/90 truncate">{user.name}</div>
              <div className="text-[10px] text-white/40 truncate">{user.email}</div>
            </div>
          </div>
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
        } ${collapsed ? "w-[4.5rem]" : "w-64"}`}
        style={{ height: "100vh" }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
