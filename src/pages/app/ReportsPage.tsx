import { FileBarChart, RefreshCw, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useTenantAnalyticsQuery } from '@/hooks/queries/useDashboardQueries';
import { AnalyticsFilterBar } from '@/modules/analytics/components/AnalyticsFilterBar';
import { ReportExportMenu } from '@/modules/analytics/components/ReportExportMenu';
import type { ReportDataset } from '@/modules/analytics/reportExport';
import { ErrorState, LoadingSkeleton } from '@/components/common/AsyncStates';
import { SectionCard } from '@/components/common/SectionCard';
import type { TenantAnalyticsData } from '@/modules/analytics/types';
import { tenantRoutes } from '@/utils/tenantRoutes';

export function ReportsPage() {
  const { domain } = useParams();
  usePageMeta({ title: 'Reports', breadcrumb: ['Workspace', 'Reports'] });
  const query = useTenantAnalyticsQuery();
  const allReports = query.data ? buildReports(query.data) : [];
  const domainPrefix: Record<string, string> = { employees: 'Employee workforce', attendance: 'Attendance', leave: 'Leave', projects: 'Project', tasks: 'Task', recruitment: 'Recruitment', teams: 'Team' };
  const reports = domain && domainPrefix[domain] ? allReports.filter((item) => item.title.startsWith(domainPrefix[domain])) : allReports;
  return <div className='space-y-5 print:space-y-3'>
    <header className='rounded-2xl border p-6' style={{ background: 'linear-gradient(125deg,rgba(37,99,235,.11),rgba(147,50,234,.05))', borderColor: 'rgba(37,99,235,.2)' }}><div className='flex items-start gap-3'><span className='rounded-xl bg-blue-500/10 p-3 text-blue-600'><FileBarChart size={22} /></span><div><h1 className='text-2xl font-bold' style={{ color: 'var(--text-primary)' }}>Enterprise report center</h1><p className='mt-1 text-sm' style={{ color: 'var(--text-secondary)' }}>Filter once, inspect governed report data, and export each report to PDF, Excel, CSV, or print.</p><p className='mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600'><ShieldCheck size={14} />Tenant-isolated and role-scoped</p></div></div></header>
    <nav className='flex gap-2 overflow-x-auto print:hidden'>{Object.keys(domainPrefix).map((item) => <Link key={item} to={`${tenantRoutes.reports()}/${item}`} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold ${domain === item ? 'bg-purple-600 text-white' : ''}`} style={domain === item ? undefined : { borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>{item[0].toUpperCase() + item.slice(1)}</Link>)}</nav>
    <div className='print:hidden'><AnalyticsFilterBar options={query.data?.filterOptions} /></div>
    {query.isLoading && <SectionCard><LoadingSkeleton lines={12} className='h-80' /></SectionCard>}
    {query.isError && <ErrorState message='Unable to load report data.' onRetry={() => void query.refetch()} />}
    {query.data && <><div className='flex items-center justify-between print:hidden'><p className='text-xs' style={{ color: 'var(--text-secondary)' }}>Generated {new Date(query.data.generatedAt).toLocaleString()}</p><button onClick={() => void query.refetch()} className='inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold' style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}><RefreshCw size={14} />Refresh</button></div><div className='grid gap-5 xl:grid-cols-2'>{reports.map((report) => <ReportCard key={report.title} report={report} />)}</div></>}
  </div>;
}

function ReportCard({ report }: { report: ReportDataset }) {
  return <SectionCard title={report.title} subtitle={`${report.rows.length} governed record${report.rows.length === 1 ? '' : 's'} in the selected scope.`} action={<ReportExportMenu report={report} />}><div className='overflow-x-auto'><table className='min-w-full text-left text-sm'><thead><tr className='border-b' style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>{report.headers.map((header) => <th key={header} className='px-3 py-2 text-xs font-semibold'>{header}</th>)}</tr></thead><tbody>{report.rows.map((row, rowIndex) => <tr key={`${report.title}-${rowIndex}`} className='border-b last:border-0' style={{ borderColor: 'var(--border-default)' }}>{row.map((cell, index) => <td key={`${index}-${String(cell)}`} className='px-3 py-3' style={{ color: index === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{String(cell ?? '')}</td>)}</tr>)}</tbody></table>{!report.rows.length && <p className='py-8 text-center text-sm' style={{ color: 'var(--text-secondary)' }}>No records match the active filters.</p>}</div></SectionCard>;
}

function buildReports(data: TenantAnalyticsData): ReportDataset[] {
  const reports: ReportDataset[] = [
    { title: 'Employee workforce report', headers: ['Role', 'Employees', 'Share'], rows: data.employeeRoleDistribution.map((item) => [item.label, item.value, `${Math.round(item.value * 100 / Math.max(1, data.totalEmployees))}%`]) },
    { title: 'Attendance report', headers: ['Date', 'Present', 'Late', 'Half day', 'Incomplete', 'Absent'], rows: data.attendanceTrend.map((item) => [item.date, item.present, item.late, item.halfDay, item.incomplete, item.absent]) },
    { title: 'Leave report', headers: ['Decision status', 'Requests', 'Share'], rows: data.leaveStatusDistribution.map((item) => [item.label, item.value, `${Math.round(item.value * 100 / Math.max(1, data.leaveStatusDistribution.reduce((sum, row) => sum + row.value, 0)))}%`]) },
    { title: 'Project delivery report', headers: ['Project', 'Completion'], rows: data.projectProgress.map((item) => [item.label, `${item.value}%`]) },
    { title: 'Task status report', headers: ['Status', 'Tasks'], rows: data.taskStatusDistribution.map((item) => [item.label, item.value]) },
    { title: 'Task risk report', headers: ['Task', 'Due date', 'Priority', 'Status'], rows: data.overdueTasks.map((item) => [item.title, item.dueDate, item.priority, item.status]) },
    { title: 'Employee workload report', headers: ['Employee', 'Assigned tasks'], rows: data.workloadByEmployee.map((item) => [item.label, item.value]) },
    { title: 'Team capacity report', headers: ['Team', 'Assigned tasks'], rows: data.teamWorkload.map((item) => [item.label, item.value]) },
  ];
  if (data.recruitment) reports.push({ title: 'Recruitment funnel report', headers: ['Stage', 'Candidates'], rows: data.recruitment.stageDistribution.map((item) => [item.label, item.value]) });
  return reports;
}
