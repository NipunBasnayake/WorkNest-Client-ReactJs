import type { ReactNode } from 'react';
import { BarChart3, BriefcaseBusiness, CalendarClock, CheckSquare2, Download, FolderKanban, Network, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useTenantAnalyticsQuery } from '@/hooks/queries/useDashboardQueries';
import { AnalyticsFilterBar } from '@/modules/analytics/components/AnalyticsFilterBar';
import { AttendanceTrendChart } from '@/modules/analytics/components/AttendanceTrendChart';
import { BarChart } from '@/modules/analytics/components/BarChart';
import { DonutChart } from '@/modules/analytics/components/DonutChart';
import { InsightPanel } from '@/modules/analytics/components/InsightPanel';
import { KpiCard } from '@/modules/analytics/components/KpiCard';
import { ErrorState, LoadingSkeleton } from '@/components/common/AsyncStates';
import { SectionCard } from '@/components/common/SectionCard';
import { tenantRoutes } from '@/utils/tenantRoutes';
import type { AnalyticsDomain, TenantAnalyticsData } from '@/modules/analytics/types';

const domains: Array<{ id: AnalyticsDomain; label: string }> = [
  { id: 'overview', label: 'Executive overview' }, { id: 'employees', label: 'Employees' },
  { id: 'attendance', label: 'Attendance' }, { id: 'leave', label: 'Leave' },
  { id: 'projects', label: 'Projects' }, { id: 'tasks', label: 'Tasks' },
  { id: 'recruitment', label: 'Recruitment' }, { id: 'teams', label: 'Teams' },
];

export function AnalyticsPage() {
  const params = useParams();
  const domain = (domains.some((item) => item.id === params.domain) ? params.domain : 'overview') as AnalyticsDomain;
  usePageMeta({ title: 'Analytics', breadcrumb: ['Workspace', 'Analytics', domains.find((item) => item.id === domain)?.label ?? 'Overview'] });
  const query = useTenantAnalyticsQuery();
  return <div className='space-y-5'>
    <header className='relative overflow-hidden rounded-2xl border p-6' style={{ background: 'linear-gradient(125deg,rgba(147,50,234,.13),rgba(37,99,235,.05))', borderColor: 'rgba(147,50,234,.2)' }}>
      <div className='relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center'><div><div className='mb-2 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600'><BarChart3 size={13} />WorkNest Intelligence</div><h1 className='text-2xl font-bold' style={{ color: 'var(--text-primary)' }}>Decision intelligence workspace</h1><p className='mt-1 text-sm' style={{ color: 'var(--text-secondary)' }}>Explore workforce health, delivery risk, capacity, and operational outcomes.</p></div><Link to={tenantRoutes.reports()} className='inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-sm font-semibold text-white'><Download size={15} />Open reports</Link></div>
    </header>
    <nav className='flex gap-1 overflow-x-auto rounded-xl border p-1.5' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>{domains.filter((item) => item.id !== 'recruitment' || query.data?.recruitment).map((item) => <Link key={item.id} to={item.id === 'overview' ? tenantRoutes.analytics() : `${tenantRoutes.analytics()}/${item.id}`} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${domain === item.id ? 'bg-purple-600 text-white' : ''}`} style={domain === item.id ? undefined : { color: 'var(--text-secondary)' }}>{item.label}</Link>)}</nav>
    <AnalyticsFilterBar options={query.data?.filterOptions} />
    {query.isLoading && <SectionCard><LoadingSkeleton lines={10} className='h-72' /></SectionCard>}
    {query.isError && <ErrorState message='Unable to load decision intelligence.' onRetry={() => void query.refetch()} />}
    {query.data && <DomainView domain={domain} data={query.data} />}
  </div>;
}

function Grid({ children }: { children: ReactNode }) { return <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-5'>{children}</div>; }

function DomainView({ domain, data }: { domain: AnalyticsDomain; data: TenantAnalyticsData }) {
  const totalTasks = data.taskStatusDistribution.reduce((sum, item) => sum + item.value, 0);
  const done = data.taskStatusDistribution.find((item) => item.label === 'Done')?.value ?? 0;
  const completion = totalTasks ? Math.round(done * 100 / totalTasks) : 0;
  const attendanceTotal = data.attendanceTrend.at(-1);
  const attendanceRate = attendanceTotal ? Math.round(attendanceTotal.present * 100 / Math.max(1, attendanceTotal.present + attendanceTotal.absent + attendanceTotal.halfDay + attendanceTotal.incomplete)) : 0;
  if (domain === 'employees') return <EmployeesView data={data} />;
  if (domain === 'attendance') return <AttendanceView data={data} rate={attendanceRate} />;
  if (domain === 'leave') return <LeaveView data={data} />;
  if (domain === 'projects') return <ProjectsView data={data} completion={completion} />;
  if (domain === 'tasks') return <TasksView data={data} completion={completion} />;
  if (domain === 'recruitment') return <RecruitmentView data={data} />;
  if (domain === 'teams') return <TeamsView data={data} />;
  return <div className='space-y-5'>
    <Grid><KpiCard label='Workforce' value={data.totalEmployees} context='Active people in scope' icon={<Users size={19} />} to={`${tenantRoutes.analytics()}/employees`} /><KpiCard label='Attendance health' value={`${attendanceRate}%`} context='Latest day in selected range' icon={<CalendarClock size={19} />} tone={attendanceRate >= 85 ? 'green' : 'amber'} to={`${tenantRoutes.analytics()}/attendance`} /><KpiCard label='Delivery rate' value={`${completion}%`} context={`${done} of ${totalTasks} tasks completed`} icon={<CheckSquare2 size={19} />} tone='blue' to={`${tenantRoutes.analytics()}/tasks`} /><KpiCard label='Overdue risk' value={data.overdueTasks.length} context='Items requiring intervention' icon={<BriefcaseBusiness size={19} />} tone={data.overdueTasks.length ? 'red' : 'green'} to={`${tenantRoutes.analytics()}/tasks`} /><KpiCard label='Active projects' value={data.activeProjects} context='Portfolio currently in motion' icon={<FolderKanban size={19} />} tone='green' to={`${tenantRoutes.analytics()}/projects`} /></Grid>
    <div className='grid gap-4 xl:grid-cols-[1.45fr_.75fr]'><AttendanceTrendChart title='Workforce availability trend' data={data.attendanceTrend.slice(-14)} /><InsightPanel insights={data.insights} /></div>
    <div className='grid gap-4 xl:grid-cols-2'><DonutChart title='Work portfolio by status' subtitle='Select Tasks to investigate underlying records' data={data.taskStatusDistribution} drillDownTo={tenantRoutes.tasks()} /><BarChart title='Project delivery progress' subtitle='Completion percentage by project' data={data.projectProgress} unit='%' drillDownTo={tenantRoutes.projects()} /></div>
  </div>;
}

function EmployeesView({ data }: { data: TenantAnalyticsData }) { return <div className='space-y-5'><Grid><KpiCard label='Employees' value={data.totalEmployees} context='People in selected scope' icon={<Users size={19} />} /><KpiCard label='Role groups' value={data.employeeRoleDistribution.length} context='Access and responsibility groups' icon={<Network size={19} />} tone='blue' /><KpiCard label='Designations' value={data.employeeDesignationDistribution.length} context='Workforce capability mix' icon={<BriefcaseBusiness size={19} />} tone='green' /></Grid><div className='grid gap-4 xl:grid-cols-2'><DonutChart title='Employee role distribution' data={data.employeeRoleDistribution} drillDownTo={tenantRoutes.employees()} /><DonutChart title='Designation distribution' data={data.employeeDesignationDistribution} drillDownTo={tenantRoutes.employees()} /></div><InsightPanel insights={data.insights} /></div>; }

function AttendanceView({ data, rate }: { data: TenantAnalyticsData; rate: number }) { const latest = data.attendanceTrend.at(-1); return <div className='space-y-5'><Grid><KpiCard label='Attendance rate' value={`${rate}%`} context='Latest reporting day' icon={<CalendarClock size={19} />} tone={rate >= 85 ? 'green' : 'amber'} /><KpiCard label='Present' value={latest?.present ?? 0} context='Latest reporting day' icon={<Users size={19} />} tone='green' /><KpiCard label='Late arrivals' value={latest?.late ?? 0} context='Latest reporting day' icon={<CalendarClock size={19} />} tone='amber' /><KpiCard label='Absent' value={latest?.absent ?? 0} context='Latest reporting day' icon={<Users size={19} />} tone='red' /></Grid><AttendanceTrendChart title='Attendance and availability trend' data={data.attendanceTrend} /><InsightPanel insights={data.insights} /></div>; }

function LeaveView({ data }: { data: TenantAnalyticsData }) { const total = data.leaveStatusDistribution.reduce((sum, item) => sum + item.value, 0); return <div className='space-y-5'><Grid><KpiCard label='Leave requests' value={total} context='Selected period' icon={<CalendarClock size={19} />} /><KpiCard label='Pending decisions' value={data.pendingLeaves} context='Requests awaiting review' icon={<CalendarClock size={19} />} tone={data.pendingLeaves ? 'amber' : 'green'} /></Grid><div className='grid gap-4 xl:grid-cols-[.8fr_1.2fr]'><DonutChart title='Leave decision distribution' data={data.leaveStatusDistribution} /><InsightPanel insights={data.insights} /></div></div>; }

function ProjectsView({ data, completion }: { data: TenantAnalyticsData; completion: number }) { return <div className='space-y-5'><Grid><KpiCard label='Active projects' value={data.activeProjects} context='Portfolio in motion' icon={<FolderKanban size={19} />} tone='blue' /><KpiCard label='Portfolio delivery' value={`${completion}%`} context='Task completion across scope' icon={<CheckSquare2 size={19} />} tone='green' /><KpiCard label='Overdue work' value={data.overdueTasks.length} context='Delivery risk across projects' icon={<BriefcaseBusiness size={19} />} tone={data.overdueTasks.length ? 'red' : 'green'} /></Grid><div className='grid gap-4 xl:grid-cols-2'><BarChart title='Project progress' subtitle='Drill into Projects for underlying work' data={data.projectProgress} unit='%' drillDownTo={tenantRoutes.projects()} /><DonutChart title='Portfolio task status' data={data.taskStatusDistribution} drillDownTo={tenantRoutes.tasks()} /></div><InsightPanel insights={data.insights} /></div>; }

function TasksView({ data, completion }: { data: TenantAnalyticsData; completion: number }) { return <div className='space-y-5'><Grid><KpiCard label='Open tasks' value={data.openTasks} context='Current work in progress' icon={<CheckSquare2 size={19} />} tone='blue' /><KpiCard label='Completion rate' value={`${completion}%`} context='Selected scope' icon={<CheckSquare2 size={19} />} tone='green' /><KpiCard label='Overdue' value={data.overdueTasks.length} context='Requires owner action' icon={<CalendarClock size={19} />} tone={data.overdueTasks.length ? 'red' : 'green'} /></Grid><div className='grid gap-4 xl:grid-cols-2'><DonutChart title='Task status distribution' data={data.taskStatusDistribution} drillDownTo={tenantRoutes.tasks()} /><BarChart title='Workload by employee' subtitle='Use this signal to rebalance capacity' data={data.workloadByEmployee} color='#2563eb' drillDownTo={tenantRoutes.tasks()} /></div><RiskTable data={data} /><InsightPanel insights={data.insights} /></div>; }

function RecruitmentView({ data }: { data: TenantAnalyticsData }) { const item = data.recruitment; if (!item) return <SectionCard title='Recruitment analytics'><p className='text-sm' style={{ color: 'var(--text-secondary)' }}>Recruitment intelligence is not available for this role.</p></SectionCard>; return <div className='space-y-5'><Grid><KpiCard label='Open positions' value={item.openJobs} context='Roles accepting candidates' icon={<BriefcaseBusiness size={19} />} /><KpiCard label='Candidates' value={item.totalCandidates} context='Talent pool' icon={<Users size={19} />} tone='blue' /><KpiCard label='Active applications' value={item.activeApplications} context='In the hiring funnel' icon={<Network size={19} />} tone='amber' /><KpiCard label='Hired' value={item.hiredCandidates} context='Successful conversions' icon={<Users size={19} />} tone='green' /><KpiCard label='Upcoming interviews' value={item.upcomingInterviews} context='Scheduled hiring activity' icon={<CalendarClock size={19} />} tone='purple' /></Grid><div className='grid gap-4 xl:grid-cols-[1.2fr_.8fr]'><DonutChart title='Recruitment funnel' data={item.stageDistribution} /><InsightPanel insights={data.insights} /></div></div>; }

function TeamsView({ data }: { data: TenantAnalyticsData }) { return <div className='space-y-5'><Grid><KpiCard label='Teams in scope' value={data.teamWorkload.length} context='Teams with assigned work' icon={<Network size={19} />} /><KpiCard label='Open workload' value={data.openTasks} context='Capacity demand' icon={<CheckSquare2 size={19} />} tone='blue' /></Grid><div className='grid gap-4 xl:grid-cols-[1.2fr_.8fr]'><BarChart title='Workload by team' subtitle='Task volume reveals capacity imbalance' data={data.teamWorkload} color='#2563eb' /><InsightPanel insights={data.insights} /></div></div>; }

function RiskTable({ data }: { data: TenantAnalyticsData }) {
  return <SectionCard title='Delivery risk register' subtitle='Click a record to drill into its source task.'><div className='overflow-x-auto'><table className='min-w-full text-left text-sm'><thead><tr className='border-b' style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}><th className='px-3 py-2'>Task</th><th className='px-3 py-2'>Due date</th><th className='px-3 py-2'>Priority</th><th className='px-3 py-2'>Status</th></tr></thead><tbody>{data.overdueTasks.map((task) => <tr key={task.id} className='border-b last:border-0' style={{ borderColor: 'var(--border-default)' }}><td className='px-3 py-3 font-semibold'><Link to={tenantRoutes.taskDetail(task.id)} className='text-purple-600 hover:underline'>{task.title}</Link></td><td className='px-3 py-3' style={{ color: 'var(--text-secondary)' }}>{new Date(task.dueDate).toLocaleDateString()}</td><td className='px-3 py-3' style={{ color: 'var(--text-secondary)' }}>{task.priority}</td><td className='px-3 py-3'><span className='rounded-full bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-600'>{task.status.replaceAll('_', ' ')}</span></td></tr>)}</tbody></table>{!data.overdueTasks.length && <p className='py-8 text-center text-sm' style={{ color: 'var(--text-secondary)' }}>No overdue work in the selected scope.</p>}</div></SectionCard>;
}
