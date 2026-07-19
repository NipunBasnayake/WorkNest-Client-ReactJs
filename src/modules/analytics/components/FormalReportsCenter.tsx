import { lazy, Suspense, useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CalendarOff,
  FolderKanban,
  Gauge,
  ListChecks,
  MessagesSquare,
  Network,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { normalizeAppRole, type NormalizedAppRole } from '@/constants/rolePermissionMap';
import { useAuthStore } from '@/store/authStore';
import { useAnalyticsFilterStore } from '@/store/analyticsFilterStore';
import { getReportCatalog, loadFormalReport, loadFullFormalReport, reportToDataset, type FormalReportData, type FormalReportDefinition, type FormalReportId, type FormalReportRequest } from '@/modules/analytics/formalReports';
import { ReportExportMenu } from '@/modules/analytics/components/ReportExportMenu';
import { AdvancedReportTable, type ReportSort } from '@/modules/analytics/components/AdvancedReportTable';
import { ErrorState, LoadingSkeleton } from '@/components/common/AsyncStates';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { SearchField } from '@/components/common/SearchField';
import { Button } from '@/components/common/Button';
import { AppSelect } from '@/components/common/AppSelect';
import { Pagination } from '@/components/common/Pagination';
import { useClientPagination } from '@/hooks/useClientPagination';
import { tenantRoutes } from '@/utils/tenantRoutes';
import { usePermission } from '@/hooks/usePermission';
import { PERMISSIONS } from '@/constants/permissions';
import { TenantLogo } from '@/features/branding/TenantLogo';
import { useBranding } from '@/features/branding/useBranding';

const BiChartCard = lazy(() => import('@/modules/analytics/components/BiChartCard'));
const statusOptions = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'ACTIVE', 'INACTIVE', 'PENDING', 'APPROVED', 'REJECTED', 'OPEN', 'PAUSED', 'CLOSED', 'APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED'];
const reportIcons: Record<FormalReportId, LucideIcon> = {
  employees: Users,
  attendance: CalendarDays,
  leave: CalendarOff,
  projects: FolderKanban,
  tasks: ListChecks,
  'recruitment-jobs': BriefcaseBusiness,
  'recruitment-applications': ListChecks,
  'recruitment-interviews': MessagesSquare,
  'recruitment-hiring': UserCheck,
  teams: UsersRound,
  audit: ShieldCheck,
  notifications: Bell,
  organization: Building2,
  'system-health': Activity,
  departments: Network,
  'new-joiners': UserPlus,
  'employee-status': UserCheck,
  'project-progress': BarChart3,
  workload: Gauge,
};

export function FormalReportsCenter() {
  const { domain } = useParams();
  const [searchParams] = useSearchParams();
  const role = normalizeAppRole(useAuthStore((state) => state.user?.role));
  const { hasPermission } = usePermission();
  const catalog = getReportCatalog(role).filter((report) => report.group !== 'Recruitment' || hasPermission(PERMISSIONS.RECRUITMENT_VIEW));
  const selectedCategory = searchParams.get('category')?.trim().toLowerCase();
  const active = domain ? catalog.find((item) => item.id === domain) : undefined;
  if (!role || !catalog.length) return <SectionCard title='Formal Reports' subtitle='No company reports are assigned to this role.'><p className='text-sm' style={{ color: 'var(--text-secondary)' }}>Employees use personal Analytics and do not receive company reporting access.</p></SectionCard>;
  if (!active) return <ReportCatalog catalog={catalog} selectedCategory={selectedCategory} />;
  return <ReportDetail key={active.id} active={active} role={role} />;
}

function ReportCatalog({ catalog, selectedCategory }: { catalog: FormalReportDefinition[]; selectedCategory?: string }) {
  const grouped = useMemo(() => {
    const groups = new Map<string, FormalReportDefinition[]>();
    catalog.forEach((report) => groups.set(report.group, [...(groups.get(report.group) ?? []), report]));
    if (selectedCategory) {
      const selected = [...groups.entries()].find(([group]) => group.toLowerCase() === selectedCategory);
      return selected ? [selected] : [...groups.entries()];
    }
    return [...groups.entries()];
  }, [catalog, selectedCategory]);

  return <div className='space-y-8 pb-8'>
    {selectedCategory ? <Button variant='ghost' size='sm' to={tenantRoutes.reports()}><ArrowLeft size={14} />All report categories</Button> : null}
    {grouped.map(([group, reports]) => <section key={group} aria-labelledby={`report-group-${group.toLowerCase()}`}>
      <div className='mb-3'>
        <p className='text-[10px] font-extrabold uppercase tracking-[.16em] text-primary-600'>Report category</p>
        <h2 id={`report-group-${group.toLowerCase()}`} className='mt-1 text-lg font-semibold' style={{ color: 'var(--text-primary)' }}>{group}</h2>
      </div>
      <nav aria-label={`${group} reports`} className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
        {reports.map((report) => {
          const Icon = reportIcons[report.id];
          return <Button key={report.id} to={`${tenantRoutes.reports()}/${report.id}`} variant='secondary' className='group h-auto min-h-40 w-full items-stretch justify-start overflow-hidden rounded-2xl p-0 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary-400/60 hover:shadow-lg'>
            <span className='flex min-w-0 flex-1 flex-col p-5'>
              <span className='flex items-start justify-between gap-4'><span className='grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-500/10 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white'><Icon size={21} aria-hidden='true' /></span><ArrowRight size={18} aria-hidden='true' className='mt-1 shrink-0 text-[var(--text-tertiary)] transition-transform group-hover:translate-x-1 group-hover:text-primary-600' /></span>
              <span className='mt-5 min-w-0'><strong className='block truncate text-sm font-bold' style={{ color: 'var(--text-primary)' }}>{report.title}</strong><span className='mt-1.5 line-clamp-3 text-xs font-normal leading-5' style={{ color: 'var(--text-secondary)' }}>{report.description}</span></span>
            </span>
          </Button>;
        })}
      </nav>
    </section>)}
  </div>;
}

function ReportDetail({ active, role }: { active: FormalReportDefinition; role: NormalizedAppRole }) {
  const { branding } = useBranding();
  const { filters, setFilter, reset } = useAnalyticsFilterStore();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [sort, setSort] = useState<ReportSort | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => new Set());
  const [serverPage, setServerPage] = useState(1);
  const [serverPageSize, setServerPageSize] = useState(20);
  const serverRequest = useMemo<FormalReportRequest>(() => ({ page: serverPage - 1, size: serverPageSize, search: deferredSearch, sort, columnFilters }), [columnFilters, deferredSearch, serverPage, serverPageSize, sort]);
  const query = useQuery({
    queryKey: ['formal-report', active.id, filters, role, active.serverPaginated ? serverRequest : null],
    queryFn: () => loadFormalReport(active.id, filters, role, active.serverPaginated ? serverRequest : undefined),
    staleTime: 30_000,
    refetchInterval: 60_000,
    placeholderData: (previous) => previous,
  });
  const rows = useMemo(() => {
    if (!query.data) return [];
    if (active.serverPaginated) return query.data.rows;
    const filtered = query.data.rows.filter((row) => {
      const matchesGlobal = !deferredSearch || query.data!.columns.some((column) => String(row[column.key] ?? '').toLowerCase().includes(deferredSearch));
      const matchesColumns = query.data!.columns.every((column) => !columnFilters[column.key] || String(row[column.key] ?? '').toLowerCase().includes(columnFilters[column.key].toLowerCase()));
      return matchesGlobal && matchesColumns;
    });
    if (!sort) return filtered;
    return [...filtered].sort((left, right) => compareCells(left[sort.key], right[sort.key]) * (sort.direction === 'asc' ? 1 : -1));
  }, [active.serverPaginated, columnFilters, deferredSearch, query.data, sort]);
  const reportPagination = useClientPagination(rows, {
    storageKey: `formal-report-${active.id}`,
    resetKey: `${active.id}|${deferredSearch}|${JSON.stringify(columnFilters)}|${JSON.stringify(filters)}|${JSON.stringify(sort)}`,
  });
  const pageOffset = active.serverPaginated ? 0 : (reportPagination.currentPage - 1) * reportPagination.pageSize;
  const currentRows = active.serverPaginated ? rows : reportPagination.paginatedItems;
  const totalItems = active.serverPaginated ? query.data?.pagination?.totalElements ?? 0 : rows.length;
  const currentPage = active.serverPaginated ? serverPage : reportPagination.currentPage;
  const pageSize = active.serverPaginated ? serverPageSize : reportPagination.pageSize;
  const backTo = active.group === 'Recruitment' ? `${tenantRoutes.reports()}?category=recruitment` : tenantRoutes.reports();
  const handleSort = (key: string) => { setServerPage(1); setSort((current) => current?.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }); };
  const handleColumnFilter = (key: string, value: string) => { setServerPage(1); setColumnFilters((current) => ({ ...current, [key]: value })); };
  const handleReportFilter: typeof setFilter = (key, value) => { setServerPage(1); setFilter(key, value); };
  const fullReportLoader = active.serverPaginated ? () => loadFullFormalReport(active.id, filters, role, serverRequest) : undefined;
  return <main className='min-w-0 space-y-5 pb-8'>
    <div className='flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between' style={{ borderColor: 'var(--brand-border)', borderLeft: '4px solid var(--brand-action)', background: 'var(--bg-surface)' }}><TenantLogo size='report' eager /><p className='text-xs font-semibold' style={{ color: 'var(--text-secondary)' }}>{branding.companyName} · Formal report</p></div>
    <PageHeader title={active.title} description={active.description} backButton={<Button to={backTo} variant='ghost' size='sm'><ArrowLeft size={15} />Back to reports</Button>} status={<span className='text-xs font-semibold text-emerald-600'>Governed · {roleLabel(role)} scope</span>} secondaryActions={<Button variant='outline' size='sm' onClick={() => void query.refetch()} loading={query.isFetching}><RefreshCw size={14} />Refresh</Button>} />
    <ReportFilters filters={filters} setFilter={handleReportFilter} onReset={() => { reset(); setSearch(''); setColumnFilters({}); setSort(null); setServerPage(1); }} />
    {query.isLoading && <ReportLoading />}{query.isError && <ErrorState message='Unable to generate this formal report.' onRetry={() => void query.refetch()} />}
    {query.data && <><ReportKpis report={query.data} /><ReportCharts report={query.data} /><SectionCard title='Search records' subtitle='Search across every displayed business column. Column-specific filters are available directly under the table headers.' variant='dense' className='print:hidden'><SearchField label='Search report records' value={search} onChange={(event) => { setServerPage(1); setSearch(event.target.value); }} onClear={() => { setServerPage(1); setSearch(''); }} placeholder='Search names, statuses, departments, identifiers…' /></SectionCard><AdvancedReportTable columns={query.data.columns} rows={rows} visibleKeys={new Set(query.data.columns.filter((column) => !hiddenColumns.has(column.key)).map((column) => column.key))} onToggleColumn={(key) => setHiddenColumns((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; })} columnFilters={columnFilters} onColumnFilter={handleColumnFilter} sort={sort} onSort={handleSort} pageOffset={pageOffset} pageSize={pageSize} /><ReportSummary report={query.data} filteredCount={totalItems} visibleColumns={query.data.columns.length - hiddenColumns.size} /><ReportExports report={query.data} currentRows={currentRows} allRows={rows} fullReportLoader={fullReportLoader} /><Pagination currentPage={currentPage} totalItems={totalItems} pageSize={pageSize} onPageChange={active.serverPaginated ? setServerPage : reportPagination.setCurrentPage} onPageSizeChange={active.serverPaginated ? (size) => { setServerPageSize(size); setServerPage(1); } : reportPagination.setPageSize} className='rounded-2xl border print:hidden' /></>}
  </main>;
}

function ReportFilters({ filters, setFilter, onReset }: { filters: ReturnType<typeof useAnalyticsFilterStore.getState>['filters']; setFilter: ReturnType<typeof useAnalyticsFilterStore.getState>['setFilter']; onReset: () => void }) { return <SectionCard title='Report filters' subtitle='Filters define the governed record set and are applied before summaries, charts, tables, and exports.' action={<Button variant='ghost' size='sm' onClick={onReset}>Reset filters</Button>} variant='dense' className='print:hidden'><div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6'><label className='space-y-1.5 text-xs font-medium'><span style={{ color: 'var(--text-secondary)' }}>From date</span><input type='date' value={filters.fromDate} onChange={(event) => setFilter('fromDate', event.target.value)} className='h-10 w-full rounded-xl border px-3 text-sm' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }} /></label><label className='space-y-1.5 text-xs font-medium'><span style={{ color: 'var(--text-secondary)' }}>To date</span><input type='date' value={filters.toDate} onChange={(event) => setFilter('toDate', event.target.value)} className='h-10 w-full rounded-xl border px-3 text-sm' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }} /></label><label className='space-y-1.5 text-xs font-medium'><span style={{ color: 'var(--text-secondary)' }}>Status</span><AppSelect value={filters.status} onChange={(event) => setFilter('status', event.target.value)}><option value=''>All statuses</option>{statusOptions.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</AppSelect></label><label className='space-y-1.5 text-xs font-medium'><span style={{ color: 'var(--text-secondary)' }}>Department</span><input value={filters.department} onChange={(event) => setFilter('department', event.target.value)} placeholder='All departments' className='h-10 w-full rounded-xl border px-3 text-sm' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }} /></label><label className='space-y-1.5 text-xs font-medium'><span style={{ color: 'var(--text-secondary)' }}>Recruitment stage</span><AppSelect value={filters.recruitmentStatus} onChange={(event) => setFilter('recruitmentStatus', event.target.value)}><option value=''>All stages</option>{['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED'].map((stage) => <option key={stage}>{stage}</option>)}</AppSelect></label><label className='space-y-1.5 text-xs font-medium'><span style={{ color: 'var(--text-secondary)' }}>Leave type</span><AppSelect value={filters.leaveType} onChange={(event) => setFilter('leaveType', event.target.value)}><option value=''>All leave types</option>{['ANNUAL', 'SICK', 'CASUAL', 'UNPAID', 'OTHER'].map((type) => <option key={type}>{type}</option>)}</AppSelect></label></div></SectionCard>; }

function ReportKpis({ report }: { report: FormalReportData }) { return <section><SectionHeading eyebrow='Report summary' title='Key statistics' /><div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>{report.summary.map((item) => <article key={item.label} className='rounded-2xl border p-4 shadow-sm' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}><p className='text-[10px] font-extrabold uppercase tracking-wide' style={{ color: 'var(--text-tertiary)' }}>{item.label}</p><p className='mt-2 text-xl font-bold' style={{ color: 'var(--text-primary)' }}>{item.value}</p></article>)}</div></section>; }
function ReportCharts({ report }: { report: FormalReportData }) { if (!report.supportingCharts.length) return null; return <section><SectionHeading eyebrow='Supporting analysis' title='Report context' /><div className='grid gap-4 lg:grid-cols-2'>{report.supportingCharts.map((chart) => <Suspense key={chart.title} fallback={<LoadingSkeleton lines={6} className='h-64' />}><BiChartCard title={chart.title} subtitle={chart.subtitle} data={chart.data} variant={chart.variant} compact showExport={false} /></Suspense>)}</div></section>; }
function ReportSummary({ report, filteredCount, visibleColumns }: { report: FormalReportData; filteredCount: number; visibleColumns: number }) { return <SectionCard title='Report summary panel' subtitle='Document control information for audit and review.' variant='dense'><dl className='grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4'><SummaryTerm label='Generated' value={new Date(report.generatedAt).toLocaleString()} /><SummaryTerm label='Filtered records' value={filteredCount.toLocaleString()} /><SummaryTerm label='Visible columns' value={visibleColumns.toString()} /><SummaryTerm label='Data source' value='Tenant operational records' /></dl></SectionCard>; }
function ReportExports({ report, currentRows, allRows, fullReportLoader }: { report: FormalReportData; currentRows: FormalReportData['rows']; allRows: FormalReportData['rows']; fullReportLoader?: () => Promise<FormalReportData> }) {
  const fullDataset = { ...reportToDataset(report, allRows), title: `${report.title} - Full Dataset` };
  const loadDataset = fullReportLoader ? async () => { const fullReport = await fullReportLoader(); return reportToDataset(fullReport, fullReport.rows); } : undefined;
  return <SectionCard title='Generate report documents' subtitle='Export the current page for review or the entire filtered dataset for audit and archival.' variant='dense' className='print:hidden'><div className='grid gap-4 md:grid-cols-2'><div className='rounded-xl border p-4' style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}><p className='mb-3 text-xs font-semibold'>Current page · {currentRows.length} records</p><ReportExportMenu report={reportToDataset(report, currentRows)} /></div><div className='rounded-xl border p-4' style={{ borderColor: 'var(--border-default)', background: 'var(--bg-muted)' }}><p className='mb-3 text-xs font-semibold'>{fullReportLoader ? 'Entire filtered dataset · loaded on export' : `Entire filtered dataset · ${allRows.length} records`}</p><ReportExportMenu report={fullDataset} loadReport={loadDataset} /></div></div></SectionCard>;
}
function ReportLoading() { return <div className='space-y-4'><div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>{[1, 2, 3, 4].map((item) => <LoadingSkeleton key={item} lines={3} className='h-28 rounded-2xl border p-4' />)}</div><LoadingSkeleton lines={12} className='h-[32rem] rounded-2xl border p-5' /></div>; }
function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) { return <div className='mb-3'><p className='text-[10px] font-extrabold uppercase tracking-[.16em] text-primary-600'>{eyebrow}</p><h2 className='mt-1 text-lg font-semibold' style={{ color: 'var(--text-primary)' }}>{title}</h2></div>; }
function SummaryTerm({ label, value }: { label: string; value: string }) { return <div><dt className='text-[10px] font-extrabold uppercase tracking-wide' style={{ color: 'var(--text-tertiary)' }}>{label}</dt><dd className='mt-1 font-semibold' style={{ color: 'var(--text-primary)' }}>{value}</dd></div>; }
function roleLabel(role: NormalizedAppRole) { return role === 'TENANT_ADMIN' ? 'Tenant Admin' : role === 'HR' ? 'HR' : role === 'MANAGER' ? 'Manager' : 'Employee'; }
function compareCells(left: unknown, right: unknown) { const leftNumber = Number(String(left ?? '').replace(/[^0-9.-]/g, '')); const rightNumber = Number(String(right ?? '').replace(/[^0-9.-]/g, '')); if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && String(left ?? '').trim() && String(right ?? '').trim()) return leftNumber - rightNumber; return String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true, sensitivity: 'base' }); }
