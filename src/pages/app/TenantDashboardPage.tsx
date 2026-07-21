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
import { tenantRoutes } from "@/utils/tenantRoutes";
import type { DashboardTaskStatusSummary, TenantDashboardSnapshot } from "@/modules/analytics/types";
import { RecruitmentDashboardWidget } from "@/modules/recruitment/components/RecruitmentDashboardWidget";
import { useBranding } from "@/features/branding/useBranding";

interface QuickAction {
  label: string;
  description: string;
  icon: ReactNode;
  to: () => string;
  permission?: Permission;
}

const ADMIN_QUICK_ACTIONS: QuickAction[] = [
  { label: "Add Employee", description: "Create and onboard employee profile", icon: <UserPlus size={18} />, to: () => tenantRoutes.employeeNew(), permission: PERMISSIONS.EMPLOYEES_MANAGE },
  { label: "Create Team", description: "Set up a new team structure", icon: <Briefcase size={18} />, to: () => tenantRoutes.teamNew(), permission: PERMISSIONS.TEAMS_MANAGE },
  { label: "Create Project", description: "Initialize a project workspace", icon: <FolderOpen size={18} />, to: () => tenantRoutes.projectNew(), permission: PERMISSIONS.PROJECTS_MANAGE },
  { label: "Create Task", description: "Assign work and due dates", icon: <CheckSquare size={18} />, to: () => tenantRoutes.taskCreate(), permission: PERMISSIONS.TASKS_MANAGE },
  { label: "Publish Announcement", description: "Share company-wide updates", icon: <Megaphone size={18} />, to: () => tenantRoutes.announcementNew(), permission: PERMISSIONS.ANNOUNCEMENTS_MANAGE },
  { label: "New Job Opening", description: "Create a new role for publication", icon: <Briefcase size={18} />, to: () => tenantRoutes.recruitmentJobNew(), permission: PERMISSIONS.RECRUITMENT_MANAGE },
  { label: "Review Applications", description: "Move candidates through the hiring pipeline", icon: <ClipboardList size={18} />, to: () => tenantRoutes.recruitmentApplications(), permission: PERMISSIONS.RECRUITMENT_VIEW },
];

const USER_QUICK_ACTIONS: QuickAction[] = [
  { label: "View My Tasks", description: "Review assigned workload", icon: <CheckSquare size={18} />, to: () => tenantRoutes.tasks(), permission: PERMISSIONS.TASKS_VIEW },
  { label: "Check Attendance", description: "View daily attendance status", icon: <CalendarClock size={18} />, to: () => tenantRoutes.attendance(), permission: PERMISSIONS.ATTENDANCE_VIEW },
  { label: "Request Leave", description: "Submit a leave request", icon: <CalendarClock size={18} />, to: () => tenantRoutes.leaveNew(), permission: PERMISSIONS.LEAVE_REQUEST },
  { label: "Announcements", description: "Read company updates", icon: <Bell size={18} />, to: () => tenantRoutes.announcements(), permission: PERMISSIONS.ANNOUNCEMENTS_VIEW },
  { label: "Notifications", description: "Review your alerts", icon: <BellRing size={18} />, to: () => tenantRoutes.notifications(), permission: PERMISSIONS.NOTIFICATIONS_VIEW },
  { label: "Open Chat", description: "Talk with your team", icon: <MessageSquare size={18} />, to: () => tenantRoutes.chat(), permission: PERMISSIONS.CHAT_VIEW },
];

const TASK_STATUS_META: Array<{ key: keyof DashboardTaskStatusSummary; label: string; color: string }> = [
  { key: "TODO", label: "To Do", color: "var(--brand-action)" },
  { key: "IN_PROGRESS", label: "In Progress", color: "var(--brand-action)" },
  { key: "IN_REVIEW", label: "In Review", color: "#d97706" },
  { key: "BLOCKED", label: "Blocked", color: "#ef4444" },
  { key: "DONE", label: "Done", color: "#10b981" },
];

export function TenantDashboardPage() {
  const { branding } = useBranding();
  usePageMeta({ title: `${branding.companyName} Dashboard`, breadcrumb: [branding.companyName, "Dashboard"] });
  const { role, user, tenantKey } = useAuth();
  const { hasPermission } = usePermission();
  const normalizedRole = String(role ?? user?.role ?? '').toUpperCase();
  const isTenantUser = normalizedRole === 'EMPLOYEE';
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
        companyName={branding.companyName}
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
        ) : normalizedRole === 'HR' || normalizedRole === 'MANAGER' ? (
          <RoleDecisionDashboard role={normalizedRole as 'HR' | 'MANAGER'} snapshot={snapshot} quickActions={normalizedRole === 'HR' ? adminQuickActions : userQuickActions} />
        ) : (
          <TenantAdminDashboard snapshot={snapshot} quickActions={adminQuickActions} canViewAnalytics={canViewAnalytics} />
        )
      )}

      {!isLoading && !errorMessage && snapshot?.recruitment && hasPermission(PERMISSIONS.RECRUITMENT_VIEW) ? (
        <RecruitmentDashboardWidget summary={snapshot.recruitment} />
      ) : null}
    </div>
  );
}

function RoleDecisionDashboard({ role, snapshot, quickActions }: { role: 'HR' | 'MANAGER'; snapshot: TenantDashboardSnapshot; quickActions: QuickAction[] }) {
  const total = snapshot.openTasks + snapshot.completedTasks;
  const completion = total ? Math.round(snapshot.completedTasks * 100 / total) : 0;
  const attendanceRate = snapshot.attendanceSummary.total ? Math.round(snapshot.attendanceSummary.present * 100 / snapshot.attendanceSummary.total) : 0;
  const isHr = role === 'HR';
  return <div className='space-y-6'>
    <div className='rounded-2xl border p-5' style={{ background: isHr ? 'linear-gradient(120deg,rgba(5,150,105,.1),rgba(37,99,235,.04))' : 'linear-gradient(120deg,rgba(37,99,235,.1),var(--glow-subtle))', borderColor: 'var(--border-default)' }}><p className='text-xs font-semibold uppercase tracking-wider' style={{ color: isHr ? '#059669' : '#2563eb' }}>{isHr ? 'People operations cockpit' : 'Delivery command center'}</p><h2 className='mt-1 text-xl font-bold' style={{ color: 'var(--text-primary)' }}>{isHr ? 'Protect workforce health and remove people bottlenecks' : 'Keep delivery predictable and team capacity balanced'}</h2><p className='mt-1 text-sm' style={{ color: 'var(--text-secondary)' }}>{isHr ? `${snapshot.pendingLeaves} leave decisions pending · ${attendanceRate}% attendance today` : `${snapshot.openTasks} open tasks · ${completion}% completion · ${snapshot.taskStatusSummary.BLOCKED} blocked`}</p></div>
    <PageSection title={isHr ? 'Workforce decisions' : 'Delivery decisions'} description='Metrics connected to actions, risk, and business outcomes.'><div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>{isHr ? <><StatCard label='Active workforce' value={snapshot.totalEmployees} icon={<Users size={20} />} accentColor='#059669' /><StatCard label='Present today' value={snapshot.presentToday} icon={<UserCheck size={20} />} accentColor='#10b981' /><StatCard label='Pending leave' value={snapshot.pendingLeaves} icon={<CalendarClock size={20} />} accentColor='#d97706' /><StatCard label='Attendance health' value={`${attendanceRate}%`} icon={<ClipboardList size={20} />} accentColor='#2563eb' /></> : <><StatCard label='Open workload' value={snapshot.openTasks} icon={<CheckSquare size={20} />} accentColor='#2563eb' /><StatCard label='Completed' value={snapshot.completedTasks} icon={<UserCheck size={20} />} accentColor='#10b981' /><StatCard label='Blocked work' value={snapshot.taskStatusSummary.BLOCKED} icon={<ClipboardList size={20} />} accentColor='#ef4444' /><StatCard label='Delivery rate' value={`${completion}%`} icon={<FolderOpen size={20} />} accentColor='var(--brand-action)' /></>}</div></PageSection>
    <div className='grid gap-4 xl:grid-cols-2'><SectionCard title={isHr ? 'People risk signals' : 'Delivery risk signals'} subtitle='Prioritized conditions requiring attention.'><div className='space-y-3'><DecisionSignal tone={snapshot.pendingLeaves ? 'warning' : 'positive'} title={`${snapshot.pendingLeaves} leave requests awaiting decision`} /><DecisionSignal tone={snapshot.taskStatusSummary.BLOCKED ? 'critical' : 'positive'} title={`${snapshot.taskStatusSummary.BLOCKED} blocked tasks`} /><DecisionSignal tone={snapshot.dueSoonTasks.length > 3 ? 'warning' : 'info'} title={`${snapshot.dueSoonTasks.length} deadlines approaching`} /></div><Button variant='outline' size='sm' to={`${tenantRoutes.analytics()}/${isHr ? 'employees' : 'tasks'}`} className='mt-4'>Investigate in Analytics</Button></SectionCard><SectionCard title='Fast actions' subtitle='Move from signal to action.'><div className='grid gap-3 sm:grid-cols-2'>{quickActions.slice(0, 4).map((action) => <QuickNavCard key={action.label} label={action.label} description={action.description} icon={action.icon} to={action.to()} />)}</div></SectionCard></div>
  </div>;
}

function DecisionSignal({ tone, title }: { tone: 'positive' | 'info' | 'warning' | 'critical'; title: string }) { const colors = { positive: '#059669', info: '#2563eb', warning: '#d97706', critical: '#dc2626' }; const color = colors[tone]; return <div className='flex items-center gap-3 rounded-xl border p-3' style={{ borderColor: `${color}35`, background: `${color}0d` }}><span className='h-2.5 w-2.5 rounded-full' style={{ background: color }} /><span className='text-sm font-semibold' style={{ color: 'var(--text-primary)' }}>{title}</span></div>; }

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
          <StatCard label="Total Employees" value={snapshot.totalEmployees} icon={<Users size={20} />} accentColor="var(--brand-action)" />
          <StatCard label="Active Teams" value={snapshot.activeTeams} icon={<Briefcase size={20} />} accentColor="var(--brand-action)" />
          <StatCard label="Active Projects" value={snapshot.activeProjects} icon={<FolderOpen size={20} />} accentColor="#10b981" />
          <StatCard label="Open Tasks" value={snapshot.openTasks} icon={<CheckSquare size={20} />} accentColor="#d97706" />
          <StatCard label="Completed Tasks" value={snapshot.completedTasks} icon={<UserCheck size={20} />} accentColor="#14b8a6" />
          <StatCard label="Task Completion" value={`${completionRate}%`} icon={<ClipboardList size={20} />} accentColor="var(--color-primary-700)" />
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
              to={action.to()}
            />
          ))}
        </div>
      </PageSection>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Task Status Summary"
          subtitle="Distribution of active and completed work."
          action={canViewAnalytics ? <Button variant="ghost" size="sm" to={tenantRoutes.analytics()}>Open Analytics</Button> : undefined}
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
                  background: "linear-gradient(90deg, var(--brand-action) 0%, #10b981 100%)",
                }}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Attendance Summary" subtitle="Today across the workspace.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricTile label="Total" value={snapshot.attendanceSummary.total} color="var(--brand-action)" />
            <MetricTile label="Present" value={snapshot.attendanceSummary.present} color="#10b981" />
            <MetricTile label="Late" value={snapshot.attendanceSummary.late} color="#d97706" />
            <MetricTile label="Absent" value={snapshot.attendanceSummary.absent} color="#ef4444" />
            <MetricTile label="Half Day" value={snapshot.attendanceSummary.halfDay} color="var(--brand-action)" />
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" to={tenantRoutes.attendance()}>View Attendance Module</Button>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Pending Leave Approvals"
          subtitle="Requests waiting for admin review."
          action={<Button variant="ghost" size="sm" to={tenantRoutes.leave()}>Open Leave</Button>}
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
                to={tenantRoutes.leaveDetail(leave.id)}
                title={`${leave.employeeName} - ${toReadableLabel(leave.leaveType)}`}
                meta={`${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}`}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Upcoming Deadlines"
          subtitle="Tasks due in the next 7 days."
          action={<Button variant="ghost" size="sm" to={tenantRoutes.tasks()}>Open Tasks</Button>}
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
                to={tenantRoutes.taskDetail(task.id)}
                title={task.title}
                meta={`Due ${formatDate(task.dueDate)} - ${toReadableLabel(task.status)} - ${toReadableLabel(task.priority)}`}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Announcements"
          subtitle="Latest internal updates."
          action={<Button variant="ghost" size="sm" to={tenantRoutes.announcements()}>View All</Button>}
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
                to={tenantRoutes.announcementDetail(announcement.id)}
                title={announcement.title}
                meta={formatDateTime(announcement.createdAt)}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Notifications"
          subtitle="Most recent alerts for your admin account."
          action={<Button variant="ghost" size="sm" to={tenantRoutes.notifications()}>View All</Button>}
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
                to={normalizeDashboardLink(notification.link)}
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
          <StatCard label="My Open Tasks" value={snapshot.openTasks} icon={<CheckSquare size={20} />} accentColor="var(--brand-action)" />
          <StatCard label="Tasks Due Soon" value={snapshot.dueSoonTasks.length} icon={<CalendarClock size={20} />} accentColor="#d97706" />
          <StatCard label="Pending Leave Requests" value={snapshot.leaveStatusSummary.PENDING} icon={<CalendarClock size={20} />} accentColor="#ef4444" />
          <StatCard label="Unread Notifications" value={snapshot.unreadNotifications} icon={<BellRing size={20} />} accentColor="var(--brand-action)" />
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
              to={action.to()}
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
            <MetricTile label="Worked Today" value={formatMinutes(snapshot.attendanceSummary.myWorkedMinutes)} color="var(--brand-action)" />
            <MetricTile label="Present (30d)" value={snapshot.attendanceSummary.present} color="#16a34a" />
            <MetricTile label="Late (30d)" value={snapshot.attendanceSummary.late} color="#d97706" />
            <MetricTile label="Absent (30d)" value={snapshot.attendanceSummary.absent} color="#ef4444" />
            <MetricTile label="Records (30d)" value={snapshot.attendanceSummary.total} color="var(--brand-action)" />
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" to={tenantRoutes.attendance()}>Open Attendance</Button>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Tasks Due Soon"
          subtitle="Your nearest task deadlines."
          action={<Button variant="ghost" size="sm" to={tenantRoutes.tasks()}>Open Tasks</Button>}
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
                to={tenantRoutes.taskDetail(task.id)}
                title={task.title}
                meta={`Due ${formatDate(task.dueDate)} - ${toReadableLabel(task.status)}`}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Leave Actions"
          subtitle="Latest activity on your leave requests."
          action={<Button variant="ghost" size="sm" to={tenantRoutes.leave()}>Open Leave</Button>}
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
                to={tenantRoutes.leaveDetail(leave.id)}
                title={`${toReadableLabel(leave.leaveType)} - ${toReadableLabel(leave.status)}`}
                meta={`${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}`}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Announcements"
          subtitle="Latest company communication."
          action={<Button variant="ghost" size="sm" to={tenantRoutes.announcements()}>View All</Button>}
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
                to={tenantRoutes.announcementDetail(announcement.id)}
                title={announcement.title}
                meta={formatDateTime(announcement.createdAt)}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="My Notifications"
          subtitle="Unread and recent alerts."
          action={<Button variant="ghost" size="sm" to={tenantRoutes.notifications()}>View All</Button>}
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
                to={normalizeDashboardLink(notification.link)}
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
  companyName,
  name,
  tenantKey,
  role,
}: {
  greeting: string;
  companyName: string;
  name?: string;
  tenantKey?: string | null;
  role?: string;
}) {
  return (
    <div
      className="rounded-2xl border p-6 sm:p-8 relative overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border-default)",
        borderTop: "3px solid var(--color-primary-500)",
      }}
    >
      <div className="relative z-10">
        <div className="mb-4 break-words text-xl font-extrabold" style={{ color: "var(--color-primary-700)" }}>{companyName}</div>
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
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

function normalizeDashboardLink(link?: string): string {
  const legacyPrefix = `/${"app"}`;

  if (!link) {
    return tenantRoutes.notifications();
  }

  if (link === legacyPrefix) {
    return tenantRoutes.dashboard();
  }

  if (link.startsWith(`${legacyPrefix}/`)) {
    return tenantRoutes.path(link.slice(legacyPrefix.length));
  }

  return link;
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
        {unread && <BellRing size={14} style={{ color: "var(--brand-action)" }} />}
      </div>
      <p className="mt-1 truncate text-xs" style={{ color: "var(--text-secondary)" }}>
        {meta}
      </p>
    </Link>
  );
}

