import type { DistributionDatum } from "@/modules/analytics/types";

interface DonutChartProps {
  title: string;
  subtitle?: string;
  data: DistributionDatum[];
}

function buildGradient(data: DistributionDatum[]): string {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  if (total <= 0) return "conic-gradient(#e2e8f0 0deg 360deg)";

  let angle = 0;
  const segments = data.map((item) => {
    const nextAngle = angle + (item.value / total) * 360;
    const segment = `${item.color} ${angle}deg ${nextAngle}deg`;
    angle = nextAngle;
    return segment;
  });

  return `conic-gradient(${segments.join(",")})`;
}

export function DonutChart({ title, subtitle, data }: DonutChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  const gradient = buildGradient(data);

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

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: gradient }}>
          <div
            className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{total}</p>
              <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Total</p>
            </div>
          </div>
        </div>

        <div className="w-full space-y-2">
          {data.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="inline-flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
