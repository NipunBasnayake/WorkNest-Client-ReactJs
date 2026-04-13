import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  Bell,
  BellRing,
  Briefcase,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  FolderOpen,
  Megaphone,
  MessageSquare,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { type Permission, PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { useTenantDashboardQuery } from "@/hooks/queries/useDashboardQueries";
import { PageSection, QuickNavCard, StatCard } from "@/components/common/AppUI";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/AsyncStates";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { formatDate, formatDateTime, formatMinutes, getDaytimeGreeting, toReadableLabel } from "@/utils/formatting";
import { getErrorMessage } from "@/utils/errorHandler";
import type { DashboardTaskStatusSummary, TenantDashboardSnapshot } from "@/modules/analytics/types";

interface QuickAction {
  label: string;
  description: string;
  icon: ReactNode;
  to: string;
  permission?: Permission;
}

const ADMIN_QUICK_ACTIONS: QuickAction[] = [
  { label: "Add Employee", description: "Create and onboard employee profile", icon: <UserPlus size={18} />, to: "/app/employees/new", permission: PERMISSIONS.EMPLOYEES_MANAGE },
  { label: "Create Team", description: "Set up a new team structure", icon: <Briefcase size={18} />, to: "/app/teams/new", permission: PERMISSIONS.TEAMS_MANAGE },
  { label: "Create Project", description: "Initialize a project workspace", icon: <FolderOpen size={18} />, to: "/app/projects/new", permission: PERMISSIONS.PROJECTS_MANAGE },
  { label: "Create Task", description: "Assign work and due dates", icon: <CheckSquare size={18} />, to: "/app/tasks/new", permission: PERMISSIONS.TASKS_MANAGE },
  { label: "Publish Announcement", description: "Share company-wide updates", icon: <Megaphone size={18} />, to: "/app/announcements/new", permission: PERMISSIONS.ANNOUNCEMENTS_MANAGE },
];

const USER_QUICK_ACTIONS: QuickAction[] = [
  { label: "View My Tasks", description: "Review assigned workload", icon: <CheckSquare size={18} />, to: "/app/tasks", permission: PERMISSIONS.TASKS_VIEW },
  { label: "Check Attendance", description: "View daily attendance status", icon: <CalendarClock size={18} />, to: "/app/attendance", permission: PERMISSIONS.ATTENDANCE_VIEW },
  { label: "Request Leave", description: "Submit a leave request", icon: <CalendarClock size={18} />, to: "/app/leave/new", permission: PERMISSIONS.LEAVE_REQUEST },
  { label: "Announcements", description: "Read company updates", icon: <Bell size={18} />, to: "/app/announcements", permission: PERMISSIONS.ANNOUNCEMENTS_VIEW },
  { label: "Notifications", description: "Review your alerts", icon: <BellRing size={18} />, to: "/app/notifications", permission: PERMISSIONS.NOTIFICATIONS_VIEW },
  { label: "Open Chat", description: "Talk with your team", icon: <MessageSquare size={18} />, to: "/app/chat", permission: PERMISSIONS.CHAT_VIEW },
];

const TASK_STATUS_META: Array<{ key: keyof DashboardTaskStatusSummary; label: string; color: string }> = [
  { key: "TODO", label: "To Do", color: "#6366f1" },
  { key: "IN_PROGRESS", label: "In Progress", color: "#9332EA" },
  { key: "IN_REVIEW", label: "In Review", color: "#d97706" },
  { key: "BLOCKED", label: "Blocked", color: "#ef4444" },
  { key: "DONE", label: "Done", color: "#10b981" },
];

export function TenantDashboardPage() {
  usePageMeta({ title: "Dashboard", breadcrumb: ["Workspace", "Dashboard"] });
  const { role, user, tenantKey } = useAuth();
  const { hasPermission } = usePermission();
  const isTenantUser = role === "EMPLOYEE";
  const { data: snapshot, error, isLoading, refetch } = useTenantDashboardQuery(true);
  const errorMessage = useMemo(
    () => (error ? getErrorMessage(error, "Could not load dashboard summary.") : null),
    [error]
  );

  const adminQuickActions = useMemo(
    () => ADMIN_QUICK_ACTIONS.filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission]
  );
  const userQuickActions = useMemo(
    () => USER_QUICK_ACTIONS.filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission]
  );

  const greeting = getDaytimeGreeting();
  const canViewAnalytics = hasPermission(PERMISSIONS.ANALYTICS_VIEW);

  return (
    <div className="space-y-6">
      <DashboardHero
        greeting={greeting}
        name={user?.name}
        tenantKey={tenantKey}
        role={user?.role}
      />

      {errorMessage && <ErrorState message={errorMessage} onRetry={() => void refetch()} />}
      {isLoading && (
        <>
          <SectionCard>
            <LoadingSkeleton lines={6} className="h-40" />
          </SectionCard>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SectionCard key={index}>
                <LoadingSkeleton lines={3} className="h-20" />
              </SectionCard>
            ))}
          </div>
        </>
      )}

      {!isLoading && !errorMessage && !snapshot && (
        <EmptyState
          title="Dashboard unavailable"
          description="Dashboard data is currently unavailable."
        />
      )}

      {!isLoading && !errorMessage && snapshot && (
        isTenantUser ? (
          <TenantUserDashboard snapshot={snapshot} quickActions={userQuickActions} />
        ) : (
          <TenantAdminDashboard snapshot={snapshot} quickActions={adminQuickActions} canViewAnalytics={canViewAnalytics} />
        )
      )}
    </div>
  );
}

function TenantAdminDashboard({
  snapshot,
  quickActions,
  canViewAnalytics,
}: {
  snapshot: TenantDashboardSnapshot;
  quickActions: QuickAction[];
  canViewAnalytics: boolean;
}) {
  const totalTasks = snapshot.openTasks + snapshot.completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((snapshot.completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageSection title="Company Overview" description="Operational health across people, work, and approvals.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Employees" value={snapshot.totalEmployees} icon={<Users size={20} />} accentColor="#9332EA" />
          <StatCard label="Active Teams" value={snapshot.activeTeams} icon={<Briefcase size={20} />} accentColor="#6366f1" />
          <StatCard label="Active Projects" value={snapshot.activeProjects} icon={<FolderOpen size={20} />} accentColor="#10b981" />
          <StatCard label="Open Tasks" value={snapshot.openTasks} icon={<CheckSquare size={20} />} accentColor="#d97706" />
          <StatCard label="Completed Tasks" value={snapshot.completedTasks} icon={<UserCheck size={20} />} accentColor="#14b8a6" />
          <StatCard label="Task Completion" value={`${completionRate}%`} icon={<ClipboardList size={20} />} accentColor="#7c3aed" />
          <StatCard label="Pending Leave Approvals" value={snapshot.pendingLeaves} icon={<CalendarClock size={20} />} accentColor="#ef4444" />
          <StatCard label="Present Today" value={snapshot.presentToday} icon={<UserCheck size={20} />} accentColor="#22c55e" />
        </div>
      </PageSection>

      <PageSection title="Quick Actions" description="Common admin actions for managing the workspace.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {quickActions.map((action) => (
            <QuickNavCard
              key={action.label}
              label={action.label}
              description={action.description}
              icon={action.icon}
              to={action.to}
            />
          ))}
        </div>
      </PageSection>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Task Status Summary"
          subtitle="Distribution of active and completed work."
          action={canViewAnalytics ? <Button variant="ghost" size="sm" to="/app/analytics">Open Analytics</Button> : undefined}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TASK_STATUS_META.map((item) => (
              <MetricTile key={item.key} label={item.label} value={snapshot.taskStatusSummary[item.key]} color={item.color} />
            ))}
          </div>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
              <span>Completion</span>
              <span>{completionRate}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: "var(--bg-muted)" }}>
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${completionRate}%`,
                  background: "linear-gradient(90deg, #9332EA 0%, #10b981 100%)",
                }}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Attendance Summary" subtitle="Today across the workspace.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricTile label="Total" value={snapshot.attendanceSummary.total} color="#9332EA" />
            <MetricTile label="Present" value={snapshot.attendanceSummary.present} color="#10b981" />
            <MetricTile label="Late" value={snapshot.attendanceSummary.late} color="#d97706" />
            <MetricTile label="Absent" value={snapshot.attendanceSummary.absent} color="#ef4444" />
            <MetricTile label="Half Day" value={snapshot.attendanceSummary.halfDay} color="#6366f1" />
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" to="/app/attendance">View Attendance Module</Button>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Pending Leave Approvals"
          subtitle="Requests waiting for admin review."
          action={<Button variant="ghost" size="sm" to="/app/leave">Open Leave</Button>}
        >
          <div className="space-y-2">
            {snapshot.pendingApprovals.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                No pending leave approvals.
              </p>
            )}
            {snapshot.pendingApprovals.map((leave) => (
              <PreviewItem
                key={leave.id}
                to={`/app/leave/${leave.id}`}
                title={`${leave.employeeName} - ${toReadableLabel(leave.leaveType)}`}
                meta={`${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}`}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Upcoming Deadlines"
          subtitle="Tasks due in the next 7 days."
          action={<Button variant="ghost" size="sm" to="/app/tasks">Open Tasks</Button>}
        >
          <div className="space-y-2">
            {snapshot.dueSoonTasks.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                No upcoming deadlines.
              </p>
            )}
            {snapshot.dueSoonTasks.map((task) => (
              <PreviewItem
                key={task.id}
                to={`/app/tasks/${task.id}`}
                title={task.title}
                meta={`Due ${formatDate(task.dueDate)} - ${toReadableLabel(task.status)} - ${toReadableLabel(task.priority)}`}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Announcements"
          subtitle="Latest internal updates."
          action={<Button variant="ghost" size="sm" to="/app/announcements">View All</Button>}
        >
          <div className="space-y-2">
            {snapshot.announcements.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                No announcements published.
              </p>
            )}
            {snapshot.announcements.map((announcement) => (
              <PreviewItem
                key={announcement.id}
                to={`/app/announcements/${announcement.id}`}
                title={announcement.title}
                meta={formatDateTime(announcement.createdAt)}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Notifications"
          subtitle="Most recent alerts for your admin account."
          action={<Button variant="ghost" size="sm" to="/app/notifications">View All</Button>}
        >
          <div className="space-y-2">
            {snapshot.notifications.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                No notifications yet.
              </p>
            )}
            {snapshot.notifications.map((notification) => (
              <PreviewItem
                key={notification.id}
                to={notification.link || "/app/notifications"}
                title={notification.title}
                meta={formatDateTime(notification.createdAt)}
                unread={!notification.read}
              />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function TenantUserDashboard({
  snapshot,
  quickActions,
}: {
  snapshot: TenantDashboardSnapshot;
  quickActions: QuickAction[];
}) {
  const myTodayStatus = snapshot.attendanceSummary.myTodayStatus === "NOT_MARKED"
    ? "Not Marked"
    : toReadableLabel(snapshot.attendanceSummary.myTodayStatus);
  const taskTotal = Object.values(snapshot.taskStatusSummary).reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-6">
      <PageSection title="My Overview" description="Personal workload, attendance, and leave at a glance.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="My Open Tasks" value={snapshot.openTasks} icon={<CheckSquare size={20} />} accentColor="#9332EA" />
          <StatCard label="Tasks Due Soon" value={snapshot.dueSoonTasks.length} icon={<CalendarClock size={20} />} accentColor="#d97706" />
          <StatCard label="Pending Leave Requests" value={snapshot.leaveStatusSummary.PENDING} icon={<CalendarClock size={20} />} accentColor="#ef4444" />
          <StatCard label="Unread Notifications" value={snapshot.unreadNotifications} icon={<BellRing size={20} />} accentColor="#6366f1" />
          <StatCard label="Today Attendance" value={myTodayStatus} icon={<UserCheck size={20} />} accentColor="#10b981" />
        </div>
      </PageSection>

      <PageSection title="Quick Actions" description="Jump directly to your daily workflow modules.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <QuickNavCard
              key={action.label}
              label={action.label}
              description={action.description}
              icon={action.icon}
              to={action.to}
            />
          ))}
        </div>
      </PageSection>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="My Task Progress" subtitle="Progress by task status.">
          <div className="space-y-3">
            {TASK_STATUS_META.map((item) => {
              const value = snapshot.taskStatusSummary[item.key];
              const percentage = taskTotal > 0 ? Math.round((value / taskTotal) * 100) : 0;
              return (
                <div key={item.key}>
                  <div className="mb-1 flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span>{item.label}</span>
                    <span>{value} ({percentage}%)</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: "var(--bg-muted)" }}>
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="My Attendance Snapshot" subtitle="Today and recent attendance activity.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricTile label="Status Today" value={myTodayStatus} color="#10b981" />
            <MetricTile label="Worked Today" value={formatMinutes(snapshot.attendanceSummary.myWorkedMinutes)} color="#9332EA" />
            <MetricTile label="Present (30d)" value={snapshot.attendanceSummary.present} color="#16a34a" />
            <MetricTile label="Late (30d)" value={snapshot.attendanceSummary.late} color="#d97706" />
            <MetricTile label="Absent (30d)" value={snapshot.attendanceSummary.absent} color="#ef4444" />
            <MetricTile label="Records (30d)" value={snapshot.attendanceSummary.total} color="#6366f1" />
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" to="/app/attendance">Open Attendance</Button>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Tasks Due Soon"
          subtitle="Your nearest task deadlines."
          action={<Button variant="ghost" size="sm" to="/app/tasks">Open Tasks</Button>}
        >
          <div className="space-y-2">
            {snapshot.dueSoonTasks.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                No due-soon tasks.
              </p>
            )}
            {snapshot.dueSoonTasks.map((task) => (
              <PreviewItem
                key={task.id}
                to={`/app/tasks/${task.id}`}
                title={task.title}
                meta={`Due ${formatDate(task.dueDate)} - ${toReadableLabel(task.status)}`}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Leave Actions"
          subtitle="Latest activity on your leave requests."
          action={<Button variant="ghost" size="sm" to="/app/leave">Open Leave</Button>}
        >
          <div className="space-y-2">
            {snapshot.recentLeaves.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                No leave activity yet.
              </p>
            )}
            {snapshot.recentLeaves.map((leave) => (
              <PreviewItem
                key={leave.id}
                to={`/app/leave/${leave.id}`}
                title={`${toReadableLabel(leave.leaveType)} - ${toReadableLabel(leave.status)}`}
                meta={`${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}`}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Announcements"
          subtitle="Latest company communication."
          action={<Button variant="ghost" size="sm" to="/app/announcements">View All</Button>}
        >
          <div className="space-y-2">
            {snapshot.announcements.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                No announcements yet.
              </p>
            )}
            {snapshot.announcements.map((announcement) => (
              <PreviewItem
                key={announcement.id}
                to={`/app/announcements/${announcement.id}`}
                title={announcement.title}
                meta={formatDateTime(announcement.createdAt)}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="My Notifications"
          subtitle="Unread and recent alerts."
          action={<Button variant="ghost" size="sm" to="/app/notifications">View All</Button>}
        >
          <div className="space-y-2">
            {snapshot.notifications.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                No notifications yet.
              </p>
            )}
            {snapshot.notifications.map((notification) => (
              <PreviewItem
                key={notification.id}
                to={notification.link || "/app/notifications"}
                title={notification.title}
                meta={formatDateTime(notification.createdAt)}
                unread={!notification.read}
              />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function DashboardHero({
  greeting,
  name,
  tenantKey,
  role,
}: {
  greeting: string;
  name?: string;
  tenantKey?: string | null;
  role?: string;
}) {
  return (
    <div
      className="rounded-2xl border p-6 sm:p-8 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(147,50,234,0.11) 0%, rgba(124,31,209,0.05) 100%)",
        borderColor: "rgba(147,50,234,0.2)",
      }}
    >
      <div className="absolute right-0 top-0 h-56 w-56 rounded-full blur-3xl opacity-20" style={{ background: "#9332EA" }} />
      <div className="relative z-10">

        <p className="text-sm font-medium" style={{ color: "var(--color-primary-600)" }}>
          {greeting}
        </p>
        <h2 className="mt-1 text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          {name ?? "Workspace User"}
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          Workspace <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{tenantKey ?? "-"}</span> - Role{" "}
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{role ?? "-"}</span>
        </p>
      </div>
    </div>
  );
}

function MetricTile({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function PreviewItem({
  to,
  title,
  meta,
  unread = false,
}: {
  to: string;
  title: string;
  meta: string;
  unread?: boolean;
}) {
  return (
    <Link
      to={to}
      className="block rounded-xl border px-3 py-2.5 transition-colors no-underline"
      style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </p>
        {unread && <BellRing size={14} style={{ color: "#9332EA" }} />}
      </div>
      <p className="mt-1 truncate text-xs" style={{ color: "var(--text-secondary)" }}>
        {meta}
      </p>
    </Link>
  );
}

