import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, MoveRight } from 'lucide-react';
import { Link } from 'react-router-dom';
type Tone = 'purple' | 'blue' | 'green' | 'amber' | 'red';
interface Props { label: string; value: string | number; context: string; icon: ReactNode; tone?: Tone; trend?: number; to?: string }
const tones: Record<Tone, [string, string]> = {
  purple: ['var(--color-primary-600)', 'var(--brand-soft)'], blue: ['#2563eb', 'rgba(37,99,235,.1)'],
  green: ['#059669', 'rgba(5,150,105,.1)'], amber: ['#d97706', 'rgba(217,119,6,.1)'], red: ['#dc2626', 'rgba(220,38,38,.1)'],
};
export function KpiCard({ label, value, context, icon, tone = 'purple', trend, to }: Props) {
  const [color, background] = tones[tone];
  const TrendIcon = trend === undefined || trend === 0 ? Minus : trend > 0 ? ArrowUpRight : ArrowDownRight;
  const card = <div className='h-full rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
    <div className='flex items-start justify-between'><div className='rounded-xl p-2.5' style={{ color, background }}>{icon}</div>{trend !== undefined && <span className='inline-flex items-center gap-1 text-xs font-semibold' style={{ color: trend >= 0 ? '#059669' : '#dc2626' }}><TrendIcon size={12} />{Math.abs(trend)}%</span>}</div>
    <p className='mt-4 text-2xl font-bold' style={{ color: 'var(--text-primary)' }}>{value}</p><p className='text-sm font-semibold' style={{ color: 'var(--text-primary)' }}>{label}</p>
    <div className='mt-2 flex items-center justify-between gap-2'><p className='text-xs' style={{ color: 'var(--text-secondary)' }}>{context}</p>{to && <MoveRight size={15} style={{ color }} />}</div>
  </div>;
  return to ? <Link to={to} className='block h-full'>{card}</Link> : card;
}
