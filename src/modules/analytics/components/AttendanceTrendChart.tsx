import type { AttendanceTrendDatum } from "@/modules/analytics/types";

interface AttendanceTrendChartProps {
  title: string;
  data: AttendanceTrendDatum[];
}

export function AttendanceTrendChart({ title, data }: AttendanceTrendChartProps) {
  return (
    <section className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
          Last 7 days trend (present, late, absent)
        </p>
      </div>

      <div className="space-y-3">
        {data.length === 0 && (
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            No attendance trend data available.
          </p>
        )}
        {data.map((day) => {
          const total = day.present + day.late + day.absent;
          const present = total > 0 ? (day.present / total) * 100 : 0;
          const late = total > 0 ? (day.late / total) * 100 : 0;
          const absent = total > 0 ? (day.absent / total) * 100 : 0;

          return (
            <div key={day.date} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "var(--text-secondary)" }}>
                  {new Date(day.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <span style={{ color: "var(--text-tertiary)" }}>
                  {total} record{total === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-muted)" }}>
                <div style={{ width: `${present}%`, backgroundColor: "#10b981" }} />
                <div style={{ width: `${late}%`, backgroundColor: "#d97706" }} />
                <div style={{ width: `${absent}%`, backgroundColor: "#ef4444" }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
