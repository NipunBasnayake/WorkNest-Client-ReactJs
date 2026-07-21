import { Filter, RotateCcw } from 'lucide-react';
import { useAnalyticsFilterStore } from '@/store/analyticsFilterStore';
import type { AnalyticsFilterOptions, AnalyticsFilters } from '@/modules/analytics/types';

const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'PENDING', 'APPROVED', 'REJECTED'];
const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export function AnalyticsFilterBar({ options }: { options?: AnalyticsFilterOptions }) {
  const { filters, setFilter, setDatePreset, reset } = useAnalyticsFilterStore();
  const select = (key: keyof AnalyticsFilters, title: string, items: Array<{ value: string; label: string }>) => (
    <label className='min-w-36 flex-1'><span className='sr-only'>{title}</span><select value={filters[key]} onChange={(event) => setFilter(key, event.target.value)} className='h-10 w-full rounded-xl border px-3 text-xs outline-none' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}><option value=''>All {title}</option>{items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
  );
  return <div className='sticky top-0 z-10 rounded-2xl border p-3 shadow-sm backdrop-blur' style={{ background: 'color-mix(in srgb, var(--bg-surface) 94%, transparent)', borderColor: 'var(--border-default)' }}>
    <div className='flex flex-wrap items-center gap-2'>
      <span className='inline-flex h-10 items-center gap-2 px-2 text-xs font-semibold' style={{ color: 'var(--text-secondary)' }}><Filter size={15} />Filters</span>
      <div className='flex rounded-xl border p-1' style={{ borderColor: 'var(--border-default)' }}>{[7, 30, 90].map((days) => <button key={days} onClick={() => setDatePreset(days)} className='rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:bg-primary-500/10' style={{ color: 'var(--text-secondary)' }}>{days}d</button>)}</div>
      <input aria-label='From date' type='date' value={filters.fromDate} onChange={(event) => setFilter('fromDate', event.target.value)} className='h-10 rounded-xl border px-2 text-xs' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
      <input aria-label='To date' type='date' value={filters.toDate} onChange={(event) => setFilter('toDate', event.target.value)} className='h-10 rounded-xl border px-2 text-xs' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
      {select('department', 'Departments', options?.departments ?? [])}{select('projectId', 'Projects', options?.projects ?? [])}{select('teamId', 'Teams', options?.teams ?? [])}{select('employeeId', 'Employees', options?.employees ?? [])}{select('status', 'Statuses', statuses.map((value) => ({ value, label: label(value) })))}
      <button onClick={reset} className='inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold' style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}><RotateCcw size={14} />Reset</button>
    </div>
  </div>;
}
