import { ArrowDown, ArrowUp, ArrowUpDown, Columns3 } from 'lucide-react';
import type { ReportCell } from '@/modules/analytics/reportExport';
import type { FormalReportColumn } from '@/modules/analytics/formalReports';
import { EmptyState } from '@/components/common/AsyncStates';
import { SemanticBadge } from '@/components/common/SemanticBadge';
import { Table } from '@/components/common/Table';

export interface ReportSort { key: string; direction: 'asc' | 'desc'; }
interface Props {
  columns: FormalReportColumn[];
  rows: Array<Record<string, ReportCell>>;
  visibleKeys: Set<string>;
  onToggleColumn: (key: string) => void;
  columnFilters: Record<string, string>;
  onColumnFilter: (key: string, value: string) => void;
  sort: ReportSort | null;
  onSort: (key: string) => void;
  pageOffset: number;
  pageSize: number;
}

export function AdvancedReportTable({ columns, rows, visibleKeys, onToggleColumn, columnFilters, onColumnFilter, sort, onSort, pageOffset, pageSize }: Props) {
  const visible = columns.filter((column) => visibleKeys.has(column.key));
  return <Table className='print:overflow-visible print:border-0 print:shadow-none'>
    <div className='flex items-center justify-between border-b px-4 py-3 print:hidden' style={{ borderColor: 'var(--border-default)' }}><div><p className='text-sm font-semibold' style={{ color: 'var(--text-primary)' }}>Detailed records</p><p className='text-xs' style={{ color: 'var(--text-secondary)' }}>Sort columns, apply column filters, and drag header edges to resize.</p></div><details className='relative'><summary className='inline-flex cursor-pointer list-none items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold' style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}><Columns3 size={14} />Columns</summary><div className='absolute right-0 z-30 mt-2 w-56 rounded-xl border p-2 shadow-xl' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>{columns.map((column) => <label key={column.key} className='flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-primary-500/5'><input type='checkbox' checked={visibleKeys.has(column.key)} disabled={visibleKeys.size === 1 && visibleKeys.has(column.key)} onChange={() => onToggleColumn(column.key)} /><span>{column.label}</span></label>)}</div></details></div>
    <div className='max-h-[42rem] overflow-auto print:max-h-none print:overflow-visible'><table className='min-w-full table-fixed text-left text-xs'><thead className='sticky top-0 z-10 print:static' style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}><tr>{visible.map((column) => <th key={column.key} aria-sort={sort?.key === column.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className={`resize-x overflow-hidden px-4 py-3 font-extrabold uppercase tracking-wide ${column.align === 'right' ? 'text-right' : ''}`} style={{ minWidth: 130, width: 180 }}><button type='button' onClick={() => onSort(column.key)} className={`inline-flex w-full items-center gap-1 ${column.align === 'right' ? 'justify-end' : ''}`} aria-label={`Sort by ${column.label}`}>{column.label}{sort?.key === column.key ? sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowUpDown size={12} className='opacity-45' />}</button></th>)}</tr><tr className='print:hidden'>{visible.map((column) => <th key={column.key} className='px-2 pb-2'><input aria-label={`Filter ${column.label}`} value={columnFilters[column.key] ?? ''} onChange={(event) => onColumnFilter(column.key, event.target.value)} placeholder={`Filter ${column.label.toLowerCase()}`} className='h-8 w-full rounded-lg border px-2 text-[11px] font-normal normal-case tracking-normal' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} /></th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} tabIndex={0} className={`${index < pageOffset || index >= pageOffset + pageSize ? 'hidden print:table-row' : ''} border-t transition-colors hover:bg-primary-500/[.04] focus:bg-primary-500/[.06] focus:outline-none`} style={{ borderColor: 'var(--border-default)' }}>{visible.map((column) => <td key={column.key} className={`truncate px-4 py-3 ${column.align === 'right' ? 'text-right font-semibold' : ''}`} style={{ color: 'var(--text-secondary)' }} title={String(row[column.key] ?? '—')}>{isSemanticColumn(column.key) ? <SemanticBadge label={String(row[column.key] ?? '—').replaceAll('_', ' ')} variant={semanticVariant(String(row[column.key] ?? ''))} showDot /> : String(row[column.key] ?? '—')}</td>)}</tr>)}</tbody></table>{!rows.length && <div className='p-6'><EmptyState title='No matching records' description='Adjust the global search, column filters, or report period.' /></div>}</div>
  </Table>;
}

function isSemanticColumn(key: string) { return ['status', 'stage', 'severity', 'priority'].includes(key); }
function semanticVariant(value: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const normalized = value.toUpperCase();
  if (['ACTIVE', 'APPROVED', 'COMPLETED', 'DONE', 'HIRED', 'READ', 'PRESENT'].includes(normalized)) return 'success';
  if (['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'OFFERED', 'SCHEDULED', 'LATE', 'MEDIUM', 'WARNING'].includes(normalized)) return 'warning';
  if (['REJECTED', 'BLOCKED', 'CANCELLED', 'ABSENT', 'CRITICAL', 'HIGH'].includes(normalized)) return 'danger';
  if (['APPLIED', 'SCREENING', 'INTERVIEW', 'TODO', 'LOW'].includes(normalized)) return 'info';
  return 'neutral';
}
