import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  CalendarClock,
  CheckSquare,
  FolderOpen,
  MessageSquare,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { TENANT_MODULE_ACCESS } from "@/constants/access";
import { getTenantDashboardSnapshot } from "@/modules/analytics/services/analyticsService";
import { ErrorBanner, PageSection, QuickNavCard, StatCard } from "@/components/common/AppUI";
import { SectionCard } from "@/components/common/SectionCard";
import type { TenantDashboardSnapshot } from "@/modules/analytics/types";

export function TenantDashboardPage() {
  usePageMeta({ title: "Dashboard", breadcrumb: ["Workspace", "Dashboard"] });
  const { user, tenantKey, hasRole } = useAuth();
  const isEmployeeOnly = hasRole("EMPLOYEE") && !hasRole("TENANT_ADMIN", "ADMIN", "MANAGER", "HR");

  const [snapshot, setSnapshot] = useState<TenantDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDashboard() {
    setLoading(true);
    setError(null);
    try {
      const data = await getTenantDashboardSnapshot();
      setSnapshot(data);
    } catch {
      setError("Could not load dashboard summary.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const quickCards = useMemo(() => {
    const cards = [
      { label: "Employees", description: "Manage people records", icon: <Users size={18} />, to: "/app/employees", roles: TENANT_MODULE_ACCESS.employees },
      { label: "Projects", description: "Track delivery status", icon: <FolderOpen size={18} />, to: "/app/projects", roles: TENANT_MODULE_ACCESS.projects },
      { label: "Tasks", description: "Track assigned and active work", icon: <CheckSquare size={18} />, to: "/app/tasks", roles: TENANT_MODULE_ACCESS.tasks },
      { label: "Analytics", description: "Review KPI insights", icon: <UserCheck size={18} />, to: "/app/analytics", roles: TENANT_MODULE_ACCESS.analytics },
      { label: "Attendance", description: "Check daily attendance records", icon: <CalendarClock size={18} />, to: "/app/attendance", roles: TENANT_MODULE_ACCESS.attendance },
      { label: "Leave", description: "Manage leave requests", icon: <CalendarClock size={18} />, to: "/app/leave", roles: TENANT_MODULE_ACCESS.leave },
      { label: "Announcements", description: "Company updates feed", icon: <Bell size={18} />, to: "/app/announcements", roles: TENANT_MODULE_ACCESS.announcements },
      { label: "Notifications", description: "Review alerts and reminders", icon: <BellRing size={18} />, to: "/app/notifications", roles: TENANT_MODULE_ACCESS.notifications },
      { label: "Chat", description: "Collaborate with teams", icon: <MessageSquare size={18} />, to: "/app/chat", roles: TENANT_MODULE_ACCESS.chat },
      { label: "Settings", description: "Configure workspace", icon: <Settings size={18} />, to: "/app/settings" },
    ];

    return cards
      .filter((card) => !card.roles || hasRole(...card.roles))
      .map((card) => ({
        label: card.label,
        description: card.description,
        icon: card.icon,
        to: card.to,
      }));
  }, [hasRole]);

  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl border p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(147,50,234,0.1) 0%, rgba(124,31,209,0.05) 100%)",
          borderColor: "rgba(147,50,234,0.2)",
        }}
      >
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full blur-3xl opacity-20" style={{ background: "#9332EA" }} />
        <div className="relative z-10">
          <p className="text-sm font-medium" style={{ color: "var(--color-primary-600)" }}>
            {greeting}
          </p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
            {user?.name ?? "Workspace User"}
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Workspace <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{tenantKey ?? "-"}</span> · Role{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{user?.role}</span>
          </p>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchDashboard} />}

      {loading && (
        <SectionCard>
          <div className="h-60 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        </SectionCard>
      )}

      {!loading && snapshot && (
        <>
          <PageSection title="Overview">
            {!isEmployeeOnly && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Employees" value={snapshot.totalEmployees} icon={<Users size={20} />} accentColor="#9332EA" />
                <StatCard label="Active Projects" value={snapshot.activeProjects} icon={<FolderOpen size={20} />} accentColor="#6366f1" />
                <StatCard label="Open Tasks" value={snapshot.openTasks} icon={<CheckSquare size={20} />} accentColor="#d97706" />
                <StatCard label="Pending Leaves" value={snapshot.pendingLeaves} icon={<CalendarClock size={20} />} accentColor="#ef4444" />
                <StatCard label="Present Today" value={snapshot.presentToday} icon={<UserCheck size={20} />} accentColor="#10b981" />
              </div>
            )}

            {isEmployeeOnly && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="My Open Tasks" value={snapshot.openTasks} icon={<CheckSquare size={20} />} accentColor="#9332EA" />
                <StatCard label="My Pending Leaves" value={snapshot.pendingLeaves} icon={<CalendarClock size={20} />} accentColor="#ef4444" />
                <StatCard label="Recent Notifications" value={snapshot.notifications.length} icon={<BellRing size={20} />} accentColor="#6366f1" />
                <StatCard label="Announcements" value={snapshot.announcements.length} icon={<Bell size={20} />} accentColor="#10b981" />
              </div>
            )}
          </PageSection>

          <PageSection title="Quick Access" description="Go directly to core operational modules.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickCards.map((card) => (
                <QuickNavCard key={card.label} {...card} />
              ))}
            </div>
          </PageSection>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SectionCard title="Recent Tasks" subtitle="Latest tasks in your workflow.">
              <div className="space-y-2">
                {snapshot.recentTasks.length === 0 && (
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    No tasks yet.
                  </p>
                )}
                {snapshot.recentTasks.map((task) => (
                  <div key={task.id} className="rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--border-default)" }}>
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      Due {new Date(task.dueDate).toLocaleDateString()} · {task.status.replace("_", " ")} · {task.priority}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Pending Approvals" subtitle="Leave requests requiring attention.">
              <div className="space-y-2">
                {snapshot.pendingApprovals.length === 0 && (
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    No pending approvals.
                  </p>
                )}
                {snapshot.pendingApprovals.map((leave) => (
                  <div key={leave.id} className="rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--border-default)" }}>
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {leave.employeeName} · {leave.leaveType}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {leave.startDate} to {leave.endDate}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Latest Announcements" subtitle="Recent workspace communications.">
              <div className="space-y-2">
                {snapshot.announcements.length === 0 && (
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    No announcements posted.
                  </p>
                )}
                {snapshot.announcements.map((announcement) => (
                  <div key={announcement.id} className="rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--border-default)" }}>
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {announcement.title}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {new Date(announcement.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Notification Preview" subtitle="Unread and recent alerts.">
              <div className="space-y-2">
                {snapshot.notifications.length === 0 && (
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    No notifications yet.
                  </p>
                )}
                {snapshot.notifications.map((notification) => (
                  <div key={notification.id} className="rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--border-default)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {notification.title}
                      </p>
                      {!notification.read && <BellRing size={14} style={{ color: "#9332EA" }} />}
                    </div>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
