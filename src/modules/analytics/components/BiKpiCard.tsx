import { useEffect, useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { BiMetric } from '@/modules/analytics/types';

const tones: Record<string, [string, string]> = {
  purple: ['var(--color-primary-600)', 'var(--brand-soft)'], blue: ['#2563eb', 'rgba(37,99,235,.12)'],
  green: ['#059669', 'rgba(5,150,105,.12)'], amber: ['#d97706', 'rgba(217,119,6,.12)'], red: ['#dc2626', 'rgba(220,38,38,.12)'],
};

export function BiKpiCard({ metric, icon }: { metric: BiMetric; icon: ReactNode }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 650);
      setDisplay(metric.value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [metric.value]);
  const [color, background] = tones[metric.tone] ?? tones.purple;
  const change = metric.changePercent;
  const unavailable = metric.context === 'No data available';
  const TrendIcon = change == null || change === 0 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight;
  const formatted = Number.isInteger(metric.value) ? Math.round(display).toLocaleString() : display.toFixed(1);
  return <article className='group relative min-h-40 overflow-hidden rounded-2xl border p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl' style={{ background: 'color-mix(in srgb,var(--bg-surface) 94%,transparent)', borderColor: 'var(--border-default)' }}>
    <span className='absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-40 blur-2xl' style={{ background }} />
    <div className='relative flex items-start justify-between gap-3'><span className='rounded-xl p-2.5' style={{ color, background }}>{icon}</span>{change != null && <span className='inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold' style={{ color: change >= 0 ? '#059669' : '#dc2626', background: change >= 0 ? 'rgba(5,150,105,.1)' : 'rgba(220,38,38,.1)' }}><TrendIcon size={12} />{Math.abs(change)}%</span>}</div>
    <p className='relative mt-4 text-2xl font-extrabold tracking-tight' style={{ color: 'var(--text-primary)' }}>{unavailable ? 'No data' : formatted}{!unavailable && <span className='ml-0.5 text-sm font-semibold' style={{ color: 'var(--text-secondary)' }}>{metric.unit}</span>}</p>
    <p className='relative mt-0.5 text-sm font-semibold' style={{ color: 'var(--text-primary)' }}>{metric.label}</p>
    <p className='relative mt-1 text-xs' style={{ color: 'var(--text-secondary)' }}>{metric.context}</p>
  </article>;
}
