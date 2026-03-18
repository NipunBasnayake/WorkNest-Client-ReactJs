import type { ProgressDatum } from "@/modules/analytics/types";

interface BarChartProps {
  title: string;
  subtitle?: string;
  data: ProgressDatum[];
  color?: string;
  unit?: string;
}

export function BarChart({ title, subtitle, data, color = "#9332EA", unit = "" }: BarChartProps) {
  const max = data.reduce((acc, item) => Math.max(acc, item.value), 0);

  return (
    <section className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {data.length === 0 && (
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            No data available.
          </p>
        )}
        {data.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.value}{unit}</span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: "var(--bg-muted)" }}>
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${max > 0 ? (item.value / max) * 100 : 0}%`,
                  background: `linear-gradient(90deg, ${color} 0%, #c084fc 100%)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
