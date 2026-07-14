import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PlatformTrendPoint } from "@/modules/platform/types";

interface Props {
  title: string;
  subtitle: string;
  data: PlatformTrendPoint[];
  valueLabel: string;
  cumulativeLabel?: string;
  color?: string;
  compact?: boolean;
}

export function PlatformTrendChart({
  title,
  subtitle,
  data,
  valueLabel,
  cumulativeLabel,
  color = "#9332ea",
  compact = false,
}: Props) {
  const gradientId = `platform-trend-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section className="rounded-2xl border p-5" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>
      </div>
      <div className={compact ? "h-52" : "h-72"}>
        {data.length === 0 ? (
          <div className="grid h-full place-items-center text-sm" style={{ color: "var(--text-tertiary)" }}>No trend data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-default)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="value" name={valueLabel} stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} />
              {cumulativeLabel ? <Area type="monotone" dataKey="cumulativeValue" name={cumulativeLabel} stroke="#64748b" strokeWidth={1.5} fill="transparent" strokeDasharray="5 4" /> : null}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
