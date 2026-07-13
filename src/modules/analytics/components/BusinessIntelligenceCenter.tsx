import { lazy, Suspense, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BarChart3, Bell, BriefcaseBusiness, CalendarCheck2, CheckSquare2, FileBarChart2, FolderKanban, RefreshCw, Users, UsersRound } from 'lucide-react';
import { useBusinessIntelligenceQuery, useTenantAnalyticsQuery, useTenantDashboardQuery } from '@/hooks/queries/useDashboardQueries';
import { useAuthStore } from '@/store/authStore';
import { normalizeAppRole } from '@/constants/rolePermissionMap';
import { tenantRoutes } from '@/utils/tenantRoutes';
import { BiFilterBar } from '@/modules/analytics/components/BiFilterBar';
import { BiKpiCard } from '@/modules/analytics/components/BiKpiCard';
import { ReportExportMenu } from '@/modules/analytics/components/ReportExportMenu';
import { ErrorState, LoadingSkeleton } from '@/components/common/AsyncStates';
import { SectionCard } from '@/components/common/SectionCard';
import type { BiChartPoint, BiMetric, BusinessIntelligenceData, TenantAnalyticsData, TenantDashboardSnapshot } from '@/modules/analytics/types';
import type { BiChartVariant, BiSeries } from '@/modules/analytics/components/BiChartCard';

const BiChartCard = lazy(() => import('@/modules/analytics/components/BiChartCard'));
type Domain = 'overview' | 'employees' | 'projects' | 'tasks' | 'attendance' | 'leave' | 'recruitment' | 'teams' | 'system';
const domains: Array<{ id: Domain; label: string }> = [{ id: 'overview', label: 'Executive' }, { id: 'employees', label: 'Employees' }, { id: 'projects', label: 'Projects' }, { id: 'tasks', label: 'Tasks' }, { id: 'attendance', label: 'Attendance' }, { id: 'leave', label: 'Leave' }, { id: 'recruitment', label: 'Recruitment' }, { id: 'teams', label: 'Teams' }, { id: 'system', label: 'System health' }];

export function BusinessIntelligenceCenter({ mode }: { mode: 'analytics' | 'reports' }) {
  const params = useParams();
  const role = normalizeAppRole(useAuthStore((state) => state.user?.role));
  const allowed = role === 'TENANT_ADMIN' || role === 'HR';
  const query = useBusinessIntelligenceQuery(allowed);
  if (role === 'MANAGER' || role === 'EMPLOYEE') return <ScopedAnalyticsCenter role={role} />;
  const visibleDomains = role === 'HR' ? domains.filter((item) => ['employees', 'attendance', 'leave', 'recruitment'].includes(item.id)) : domains;
  const domain = (visibleDomains.some((item) => item.id === params.domain) ? params.domain : visibleDomains[0]?.id ?? 'overview') as Domain;
  const base = mode === 'reports' ? tenantRoutes.reports() : tenantRoutes.analytics();
  if (!allowed) return <SectionCard title='Business Intelligence Center' subtitle='Company-wide intelligence is governed by tenant administration.'><p className='text-sm' style={{ color: 'var(--text-secondary)' }}>Your Manager workspace remains scoped to operational dashboards. Ask a Tenant Admin for an exported company report when required.</p></SectionCard>;
  return <div className='space-y-5 pb-8'>
    <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
      <nav className='scrollbar-hide flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-2xl border p-1.5 print:hidden' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>{visibleDomains.map((item) => <Link key={item.id} to={item.id === 'overview' ? base : `${base}/${item.id}`} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition ${domain === item.id ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'hover:bg-purple-500/10'}`} style={domain === item.id ? undefined : { color: 'var(--text-secondary)' }}>{item.label}</Link>)}</nav>
      <div className='flex shrink-0 flex-wrap gap-2 print:hidden'>{query.data && <ReportExportMenu report={{ title: 'WorkNest executive BI report', headers: ['KPI', 'Value', 'Context'], rows: query.data.kpis.map((item) => [item.label, `${item.value}${item.unit}`, item.context]) }} />}<button onClick={() => void query.refetch()} className='inline-flex h-9 items-center gap-2 rounded-xl bg-purple-600 px-3 text-xs font-bold text-white shadow-lg shadow-purple-500/20'><RefreshCw size={14} className={query.isFetching ? 'animate-spin' : ''} />Refresh</button></div>
    </div>
    <BiFilterBar options={query.data?.filterOptions} />
    {query.isLoading && <LoadingView />}
    {query.isError && <ErrorState message='Unable to load the governed BI snapshot.' onRetry={() => void query.refetch()} />}
    {query.data && <Dashboard domain={domain} data={query.data} />}
  </div>;
}

function ScopedAnalyticsCenter({ role }: { role: 'MANAGER' | 'EMPLOYEE' }) {
  const analytics = useTenantAnalyticsQuery();
  const snapshot = useTenantDashboardQuery();
  const loading = analytics.isLoading || snapshot.isLoading;
  if (loading) return <LoadingView />;
  if (analytics.isError || snapshot.isError || !analytics.data || !snapshot.data) return <ErrorState message='Unable to load your scoped analytics workspace.' onRetry={() => { void analytics.refetch(); void snapshot.refetch(); }} />;
  return <div className='space-y-6 pb-8'><ScopedDashboard role={role} data={analytics.data} snapshot={snapshot.data} /></div>;
}

function ScopedDashboard({ role, data, snapshot }: { role: 'MANAGER' | 'EMPLOYEE'; data: TenantAnalyticsData; snapshot: TenantDashboardSnapshot }) {
  const taskTotal = data.taskStatusDistribution.reduce((sum, item) => sum + item.value, 0);
  const done = data.taskStatusDistribution.find((item) => item.label === 'Done')?.value ?? snapshot.completedTasks;
  const completion = taskTotal ? Math.round(done * 100 / taskTotal) : 0;
  const attendance = snapshot.attendanceSummary;
  const metrics: BiMetric[] = role === 'MANAGER' ? [
    roleMetric('open', 'Open team tasks', data.openTasks, 'Work currently in progress', 'blue'),
    roleMetric('completion', 'Completion rate', completion, 'Task delivery in visible scope', 'green', '%'),
    roleMetric('overdue', 'Overdue work', data.overdueTasks.length, 'Requires owner action', data.overdueTasks.length ? 'red' : 'green'),
    roleMetric('projects', 'Active projects', data.activeProjects, 'Visible delivery portfolio', 'purple'),
    roleMetric('teams', 'Teams in scope', data.teamWorkload.length, 'Workload-bearing teams', 'purple'),
  ] : [
    roleMetric('assigned', 'Assigned tasks', taskTotal, 'Your visible task portfolio', 'purple'),
    roleMetric('open', 'Open tasks', data.openTasks, 'Still requiring completion', 'blue'),
    roleMetric('completion', 'Completion rate', completion, 'Personal delivery rate', 'green', '%'),
    roleMetric('attendance', 'Attendance status', attendance.myWorkedMinutes, `${attendance.myTodayStatus.replaceAll('_', ' ')} today`, attendance.myTodayStatus === 'ABSENT' ? 'red' : 'green', ' min'),
    roleMetric('leave', 'Pending leave', data.pendingLeaves, 'Awaiting a decision', 'amber'),
  ];
  const attendancePoints: BiChartPoint[] = [{ label: 'Present', value: attendance.present, secondaryValue: null, tertiaryValue: null, id: null }, { label: 'Late', value: attendance.late, secondaryValue: null, tertiaryValue: null, id: null }, { label: 'Absent', value: attendance.absent, secondaryValue: null, tertiaryValue: null, id: null }, { label: 'Half day', value: attendance.halfDay, secondaryValue: null, tertiaryValue: null, id: null }];
  type ScopedChart = { title: string; subtitle: string; data: Array<{ label: string; value: number; id?: string | null; secondaryValue?: number | null }>; variant: BiChartVariant; route: (point: BiChartPoint) => string; unit?: string };
  const charts: ScopedChart[] = role === 'MANAGER' ? [
    { title: 'Task progress', subtitle: 'Visible work by workflow status', data: data.taskStatusDistribution, variant: 'donut' as const, route: (point: BiChartPoint) => `${tenantRoutes.tasks()}?status=${point.label.replaceAll(' ', '_').toUpperCase()}` },
    { title: 'Project progress', subtitle: 'Task completion by project', data: data.projectProgress, variant: 'horizontalBar' as const, route: (point: BiChartPoint) => point.id ? tenantRoutes.projectDetail(point.id) : tenantRoutes.projects(), unit: '%' },
    { title: 'Team workload', subtitle: 'Open work distributed across teams', data: data.teamWorkload, variant: 'horizontalBar' as const, route: () => tenantRoutes.teams() },
    { title: 'Resource utilization', subtitle: 'Assigned work by employee', data: data.workloadByEmployee, variant: 'bar' as const, route: () => tenantRoutes.tasks() },
  ] : [
    { title: 'My task completion', subtitle: 'Assigned tasks by workflow status', data: data.taskStatusDistribution, variant: 'donut' as const, route: (point: BiChartPoint) => `${tenantRoutes.tasks()}?status=${point.label.replaceAll(' ', '_').toUpperCase()}` },
    { title: 'My attendance', subtitle: 'Personal attendance summary', data: attendancePoints, variant: 'bar' as const, route: () => tenantRoutes.attendance() },
    { title: 'My leave history', subtitle: 'Leave requests by decision status', data: data.leaveStatusDistribution, variant: 'donut' as const, route: () => tenantRoutes.leave() },
  ];
  return <><div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5'>{metrics.map((metric) => <BiKpiCard key={metric.key} metric={metric} icon={metricIcon(metric.key)} />)}</div><div className='grid gap-5 xl:grid-cols-2'>{charts.map((chart) => <Suspense key={chart.title} fallback={<LoadingSkeleton lines={7} className='h-96' />}><BiChartCard title={chart.title} subtitle={chart.subtitle} data={chart.data.map((item) => ({ ...item, secondaryValue: item.secondaryValue ?? null, tertiaryValue: null, id: item.id ?? null }))} variant={chart.variant} drillDown={chart.route} unit={chart.unit} /></Suspense>)}</div></>;
}

function roleMetric(key: string, label: string, value: number, context: string, tone: string, unit = ''): BiMetric { return { key, label, value, context, tone, unit, changePercent: null }; }

function LoadingView() { return <div className='space-y-5'><div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'><LoadingSkeleton lines={3} className='h-40' /><LoadingSkeleton lines={3} className='h-40' /><LoadingSkeleton lines={3} className='h-40' /><LoadingSkeleton lines={3} className='h-40' /></div><div className='grid gap-5 xl:grid-cols-2'><LoadingSkeleton lines={8} className='h-96' /><LoadingSkeleton lines={8} className='h-96' /></div></div>; }

function Dashboard({ domain, data }: { domain: Domain; data: BusinessIntelligenceData }) {
  const keys: Record<Domain, string[]> = {
    overview: ['employees', 'runningProjects', 'openTasks', 'overdueTasks', 'attendanceRate', 'pendingLeave', 'openJobs', 'hires', 'teams', 'unreadNotifications'],
    employees: ['employees', 'activeEmployees', 'newEmployees'], projects: ['projects', 'runningProjects', 'completedProjects', 'projectHealth'], tasks: ['openTasks', 'completedTasks', 'blockedTasks', 'overdueTasks'], attendance: ['attendanceRate', 'presentToday', 'lateToday', 'absentToday'], leave: ['pendingLeave', 'approvedLeave', 'averageLeave'], recruitment: ['openJobs', 'applications', 'interviews', 'hires', 'acceptanceRate'], teams: ['teams', 'largestTeam', 'averageTeam'], system: ['notifications', 'announcements', 'unreadNotifications'],
  };
  const metrics = data.kpis.filter((metric) => keys[domain].includes(metric.key));
  return <div className='space-y-6'><div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5'>{metrics.map((metric) => <BiKpiCard key={metric.key} metric={metric} icon={metricIcon(metric.key)} />)}</div><ChartGrid domain={domain} data={data} />{(domain === 'system' || domain === 'overview') && <ActivityTable data={data} />}</div>;
}

function ChartGrid({ domain, data }: { domain: Domain; data: BusinessIntelligenceData }) {
  const configs = chartConfigs(data).filter((item) => item.domains.includes(domain));
  return <div className='grid gap-5 xl:grid-cols-2'>{configs.map((config) => <Suspense key={config.key} fallback={<LoadingSkeleton lines={7} className='h-96' />}><BiChartCard title={config.title} subtitle={config.subtitle} data={config.data} variant={config.variant} series={config.series} unit={config.unit} drillDown={config.drillDown} /></Suspense>)}</div>;
}

interface ChartConfig { key: string; domains: Domain[]; title: string; subtitle: string; data: BiChartPoint[]; variant: BiChartVariant; series?: BiSeries[]; unit?: string; drillDown?: (point: BiChartPoint) => string; }
function chartConfigs(data: BusinessIntelligenceData): ChartConfig[] {
  const chart = (key: string) => data.charts[key] ?? [];
  const path = (base: string, key: string, point: BiChartPoint) => `${base}?${new URLSearchParams({ [key]: point.id ?? point.label.replaceAll(' ', '_').toUpperCase() })}`;
  const healthMetric = data.kpis.find((item) => item.key === 'projectHealth');
  const health: BiChartPoint[] = [{ label: 'Project health', value: healthMetric?.value ?? 0, secondaryValue: null, tertiaryValue: null, id: null }];
  return [
    { key: 'employeeGrowth', domains: ['employees'], title: 'Employee joining trend', subtitle: 'New employees joining over the selected period', data: chart('employeeGrowth'), variant: 'area', drillDown: () => tenantRoutes.employees() },
    { key: 'employeesByDepartment', domains: ['overview', 'employees'], title: 'Employees by department', subtitle: 'Workforce allocation across business functions', data: chart('employeesByDepartment'), variant: 'donut', drillDown: (point) => path(tenantRoutes.employees(), 'department', point) },
    { key: 'employeesByDesignation', domains: ['employees'], title: 'Employees by designation', subtitle: 'Capability mix and role concentration', data: chart('employeesByDesignation'), variant: 'horizontalBar', drillDown: (point) => path(tenantRoutes.employees(), 'search', point) },
    { key: 'employeeStatus', domains: ['employees'], title: 'Employee status', subtitle: 'Active and inactive workforce composition', data: chart('employeeStatus'), variant: 'pie', drillDown: (point) => path(tenantRoutes.employees(), 'status', point) },
    { key: 'projectsByStatus', domains: ['overview', 'projects'], title: 'Projects by status', subtitle: 'Portfolio distribution and delivery state', data: chart('projectsByStatus'), variant: 'donut', drillDown: (point) => path(tenantRoutes.projects(), 'status', point) },
    { key: 'projectProgress', domains: ['projects'], title: 'Project progress', subtitle: 'Task-based completion percentage by project', data: chart('projectProgress'), variant: 'horizontalBar', unit: '%', drillDown: (point) => point.id ? tenantRoutes.projectDetail(point.id) : tenantRoutes.projects() },
    { key: 'projectsCreated', domains: ['projects'], title: 'Projects created per month', subtitle: 'Demand entering the delivery portfolio', data: chart('projectsCreated'), variant: 'line', drillDown: () => tenantRoutes.projects() },
    { key: 'projectHealth', domains: ['projects'], title: 'Project health score', subtitle: 'Completion-weighted portfolio signal', data: health, variant: 'gauge', unit: '%', drillDown: () => tenantRoutes.projects() },
    { key: 'tasksByStatus', domains: ['overview', 'tasks'], title: 'Tasks by status', subtitle: 'Work distribution across the delivery workflow', data: chart('tasksByStatus'), variant: 'donut', drillDown: (point) => path(tenantRoutes.tasks(), 'status', point) },
    { key: 'taskPriority', domains: ['tasks'], title: 'Task priority mix', subtitle: 'Urgency profile of current work', data: chart('taskPriority'), variant: 'bar', drillDown: (point) => path(tenantRoutes.tasks(), 'priority', point) },
    { key: 'taskCompletionTrend', domains: ['tasks'], title: 'Task completion trend', subtitle: 'Completed work compared with total activity', data: chart('taskCompletionTrend'), variant: 'line', series: [{ key: 'value', label: 'Completed', color: '#10b981' }, { key: 'secondaryValue', label: 'Total', color: '#9332ea' }], drillDown: () => tenantRoutes.tasks() },
    { key: 'teamWorkload', domains: ['tasks', 'teams'], title: 'Team workload', subtitle: 'Open work currently assigned to each team', data: chart('teamWorkload'), variant: 'horizontalBar', drillDown: (point) => path(tenantRoutes.tasks(), 'team', point) },
    { key: 'attendanceTrend', domains: ['overview', 'attendance'], title: 'Attendance trend', subtitle: 'Present, late, and absent records by day', data: chart('attendanceTrend'), variant: 'area', series: [{ key: 'value', label: 'Present', color: '#10b981' }, { key: 'secondaryValue', label: 'Late', color: '#f59e0b' }, { key: 'tertiaryValue', label: 'Absent', color: '#ef4444' }], drillDown: () => tenantRoutes.attendance() },
    { key: 'leaveTypes', domains: ['leave'], title: 'Leave type distribution', subtitle: 'Demand by leave category', data: chart('leaveTypes'), variant: 'pie', drillDown: (point) => path(tenantRoutes.leave(), 'type', point) },
    { key: 'leaveTrend', domains: ['leave'], title: 'Leave trend and approvals', subtitle: 'Requests compared with approvals by month', data: chart('leaveTrend'), variant: 'area', series: [{ key: 'value', label: 'Requests', color: '#9332ea' }, { key: 'secondaryValue', label: 'Approved', color: '#10b981' }], drillDown: () => tenantRoutes.leave() },
    { key: 'recruitmentPipeline', domains: ['overview', 'recruitment'], title: 'Recruitment conversion funnel', subtitle: 'Candidate movement from application to hire', data: chart('recruitmentPipeline'), variant: 'funnel', drillDown: (point) => path(tenantRoutes.recruitmentApplications(), 'status', point) },
    { key: 'applicationsByJob', domains: ['recruitment'], title: 'Applications per job', subtitle: 'Candidate demand by open position', data: chart('applicationsByJob'), variant: 'horizontalBar', drillDown: () => tenantRoutes.recruitmentApplications() },
    { key: 'hiringTrend', domains: ['recruitment'], title: 'Hiring trend', subtitle: 'Successful hires by month', data: chart('hiringTrend'), variant: 'line', drillDown: () => tenantRoutes.recruitmentApplications() },
    { key: 'teamSizes', domains: ['teams'], title: 'Team member distribution', subtitle: 'Active membership across teams', data: chart('teamSizes'), variant: 'radar', drillDown: (point) => point.id ? tenantRoutes.teamDetail(point.id) : tenantRoutes.teams() },
    { key: 'notificationVolume', domains: ['system'], title: 'Notification volume', subtitle: 'System messaging generated by month', data: chart('notificationVolume'), variant: 'line', drillDown: () => tenantRoutes.notifications() },
    { key: 'announcementVolume', domains: ['system'], title: 'Announcements created', subtitle: 'Company communication cadence', data: chart('announcementVolume'), variant: 'bar', drillDown: () => tenantRoutes.announcements() },
  ];
}

function ActivityTable({ data }: { data: BusinessIntelligenceData }) { return <div className='overflow-hidden rounded-2xl border' style={{ borderColor: 'var(--border-default)', background: 'var(--bg-surface)' }}><div className='max-h-96 overflow-auto'><table className='min-w-full text-left text-xs'><thead className='sticky top-0' style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}><tr><th className='px-4 py-3'>Time</th><th className='px-4 py-3'>Actor</th><th className='px-4 py-3'>Action</th><th className='px-4 py-3'>Entity</th></tr></thead><tbody>{data.recentActivities.map((item) => <tr key={item.id} className='border-t' style={{ borderColor: 'var(--border-default)' }}><td className='whitespace-nowrap px-4 py-3' style={{ color: 'var(--text-secondary)' }}>{new Date(item.occurredAt).toLocaleString()}</td><td className='px-4 py-3 font-semibold' style={{ color: 'var(--text-primary)' }}>{item.actor || 'System'}</td><td className='px-4 py-3'><span className='rounded-full bg-purple-500/10 px-2 py-1 font-bold text-purple-600'>{item.action.replaceAll('_', ' ')}</span></td><td className='px-4 py-3' style={{ color: 'var(--text-secondary)' }}>{item.entityType.replaceAll('_', ' ')}</td></tr>)}</tbody></table>{!data.recentActivities.length && <p className='p-8 text-center text-sm' style={{ color: 'var(--text-tertiary)' }}>No audit activity in this period.</p>}</div></div>; }
function metricIcon(key: string): ReactNode { if (key.includes('employee')) return <Users size={19} />; if (key.includes('project')) return <FolderKanban size={19} />; if (key.includes('task')) return <CheckSquare2 size={19} />; if (key.includes('leave') || key.includes('present') || key.includes('late') || key.includes('absent')) return <CalendarCheck2 size={19} />; if (key.includes('job') || key.includes('application') || key.includes('interview') || key.includes('hire')) return <BriefcaseBusiness size={19} />; if (key.includes('team')) return <UsersRound size={19} />; if (key.includes('notification')) return <Bell size={19} />; if (key.includes('announcement')) return <FileBarChart2 size={19} />; return <BarChart3 size={19} />; }
