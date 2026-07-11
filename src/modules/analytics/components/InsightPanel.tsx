import { AlertTriangle, CheckCircle2, Info, ShieldAlert, Sparkles } from 'lucide-react';
import type { BusinessInsight } from '@/modules/analytics/types';

const meta = {
  positive: [CheckCircle2, '#059669'], info: [Info, '#2563eb'],
  warning: [AlertTriangle, '#d97706'], critical: [ShieldAlert, '#dc2626'],
} as const;

export function InsightPanel({ insights }: { insights: BusinessInsight[] }) {
  return <section className='rounded-2xl border p-5' style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
    <div className='mb-4 flex items-center gap-2'><span className='rounded-lg bg-purple-500/10 p-2 text-purple-600'><Sparkles size={17} /></span><div><h3 className='text-sm font-semibold' style={{ color: 'var(--text-primary)' }}>Business insights</h3><p className='text-xs' style={{ color: 'var(--text-secondary)' }}>Signals requiring attention or recognition</p></div></div>
    <div className='space-y-2.5'>{insights.map((insight) => { const [Icon, color] = meta[insight.severity]; return <div key={insight.id} className='rounded-xl border p-3' style={{ borderColor: `${color}35`, background: `${color}0d` }}><div className='flex gap-3'><Icon size={17} className='mt-0.5 shrink-0' style={{ color }} /><div><p className='text-sm font-semibold' style={{ color: 'var(--text-primary)' }}>{insight.title}</p><p className='mt-0.5 text-xs leading-5' style={{ color: 'var(--text-secondary)' }}>{insight.description}</p></div></div></div>; })}</div>
  </section>;
}
