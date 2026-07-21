import { Lightbulb } from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Funnel, FunnelChart, LabelList,
  Legend, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  Radar, RadarChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { BiChartPoint } from '@/modules/analytics/types';
import { ReportExportMenu } from '@/modules/analytics/components/ReportExportMenu';

export type BiChartVariant = 'area' | 'line' | 'bar' | 'horizontalBar' | 'donut' | 'pie' | 'radar' | 'funnel' | 'gauge';
export interface BiSeries { key: 'value' | 'secondaryValue' | 'tertiaryValue'; label: string; color: string; }
interface Props { title: string; subtitle: string; data: BiChartPoint[]; variant: BiChartVariant; insight?: string; series?: BiSeries[]; unit?: string; compact?: boolean; showExport?: boolean; }
const palette = ['var(--color-primary-500)', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', 'var(--color-primary-300)', '#64748b'];
const tooltipStyle = { background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)' };

export default function BiChartCard({ title, subtitle, data, variant, insight, series = [{ key: 'value', label: 'Value', color: 'var(--color-primary-500)' }], unit = '', compact = false, showExport = true }: Props) {
  const report = { title, headers: ['Category', ...series.map((item) => item.label)], rows: data.map((point) => [point.label, ...series.map((item) => point[item.key] ?? 0)]) };
  return <article className='overflow-hidden rounded-2xl border shadow-sm' style={{ background: 'color-mix(in srgb,var(--bg-surface) 96%,transparent)', borderColor: 'var(--border-default)' }}>
    <header className={`flex flex-col gap-3 border-b ${compact ? 'p-4' : 'p-5'} sm:flex-row sm:items-start sm:justify-between`} style={{ borderColor: 'var(--border-default)' }}><div><h3 className='text-sm font-bold' style={{ color: 'var(--text-primary)' }}>{title}</h3><p className='mt-1 text-xs' style={{ color: 'var(--text-secondary)' }}>{subtitle}</p></div>{showExport && <ReportExportMenu report={report} compact />}</header>
    <div className={compact ? 'h-64 p-3' : 'h-72 p-4'}>
      {!data.length ? <div className='grid h-full place-items-center text-sm' style={{ color: 'var(--text-tertiary)' }}>No data matches the selected filters.</div> : <ResponsiveContainer width='100%' height='100%'>{renderChart(variant, data, series, unit)}</ResponsiveContainer>}
    </div>
    {insight && !compact && <footer className='flex gap-2 border-t px-5 py-3 text-xs leading-5' style={{ borderColor: 'var(--border-default)', background: 'color-mix(in srgb,var(--bg-muted) 58%,transparent)', color: 'var(--text-secondary)' }}><Lightbulb size={15} className='mt-0.5 shrink-0 text-amber-500' /><span><strong style={{ color: 'var(--text-primary)' }}>Insight:</strong> {insight}</span></footer>}
  </article>;
}

function axes(horizontal = false) {
  return <><CartesianGrid stroke='var(--border-default)' strokeDasharray='3 5' vertical={!horizontal} opacity={0.55} />{horizontal ? <><XAxis type='number' tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis dataKey='label' type='category' width={92} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} /></> : <><XAxis dataKey='label' tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} /><YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} width={34} /></>}<Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} /></>;
}

function renderChart(variant: BiChartVariant, data: BiChartPoint[], series: BiSeries[], unit: string) {
  if (variant === 'donut' || variant === 'pie') return <PieChart><Tooltip contentStyle={tooltipStyle} formatter={(value) => `${String(value)}${unit}`} /><Pie data={data} dataKey='value' nameKey='label' cx='50%' cy='50%' innerRadius={variant === 'donut' ? 62 : 0} outerRadius={95} paddingAngle={2} stroke='var(--bg-surface)' strokeWidth={2}>{data.map((point, index) => <Cell key={point.label} fill={palette[index % palette.length]} />)}</Pie><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart>;
  if (variant === 'funnel') return <FunnelChart><Tooltip contentStyle={tooltipStyle} /><Funnel dataKey='value' data={data} isAnimationActive><LabelList position='right' fill='var(--text-secondary)' stroke='none' dataKey='label' />{data.map((point, index) => <Cell key={point.label} fill={palette[index % palette.length]} />)}</Funnel></FunnelChart>;
  if (variant === 'gauge') { const value = data[0]?.value ?? 0; return <RadialBarChart innerRadius='70%' outerRadius='100%' data={[{ label: data[0]?.label ?? 'Health', value, fill: value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444' }]} startAngle={210} endAngle={-30}><PolarAngleAxis type='number' domain={[0, 100]} tick={false} /><RadialBar dataKey='value' background cornerRadius={12} /><text x='50%' y='48%' textAnchor='middle' dominantBaseline='middle' fill='var(--text-primary)' fontSize='28' fontWeight='800'>{value}%</text><text x='50%' y='61%' textAnchor='middle' fill='var(--text-secondary)' fontSize='11'>Health score</text></RadialBarChart>; }
  if (variant === 'radar') return <RadarChart data={data}><PolarGrid stroke='var(--border-default)' /><PolarAngleAxis dataKey='label' tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} /><PolarRadiusAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} /><Radar name={series[0].label} dataKey={series[0].key} stroke={series[0].color} fill={series[0].color} fillOpacity={0.28} /><Tooltip contentStyle={tooltipStyle} /></RadarChart>;
  if (variant === 'bar' || variant === 'horizontalBar') return <BarChart data={data} layout={variant === 'horizontalBar' ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>{axes(variant === 'horizontalBar')}{series.map((item) => <Bar key={item.key} dataKey={item.key} name={item.label} fill={item.color} radius={variant === 'horizontalBar' ? [0, 7, 7, 0] : [7, 7, 0, 0]} maxBarSize={34} />)}</BarChart>;
  if (variant === 'area') return <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}><defs>{series.map((item) => <linearGradient key={item.key} id={`fill-${item.key}-${item.color.slice(1)}`} x1='0' y1='0' x2='0' y2='1'><stop offset='5%' stopColor={item.color} stopOpacity={0.38} /><stop offset='95%' stopColor={item.color} stopOpacity={0.02} /></linearGradient>)}</defs>{axes()}{series.map((item) => <Area key={item.key} type='monotone' dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={2.5} fill={`url(#fill-${item.key}-${item.color.slice(1)})`} connectNulls />)}</AreaChart>;
  return <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>{axes()}{series.map((item) => <Line key={item.key} type='monotone' dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={2.5} dot={{ r: 3, fill: item.color, strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />)}</LineChart>;
}
