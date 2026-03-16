interface StatusBadgeProps {
  status: string;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "rgba(16,185,129,0.1)", text: "#10b981", dot: "#10b981" },
  planned: { bg: "rgba(99,102,241,0.12)", text: "#6366f1", dot: "#6366f1" },
  planning: { bg: "rgba(124,58,237,0.12)", text: "#7c3aed", dot: "#7c3aed" },
  completed: { bg: "rgba(16,185,129,0.1)", text: "#10b981", dot: "#10b981" },
  cancelled: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", dot: "#ef4444" },
  on_hold: { bg: "rgba(245,158,11,0.12)", text: "#d97706", dot: "#d97706" },
  blocked: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", dot: "#ef4444" },
  inactive: { bg: "rgba(156,163,175,0.1)", text: "#9ca3af", dot: "#9ca3af" },
  archived: { bg: "rgba(148,163,184,0.12)", text: "#94a3b8", dot: "#94a3b8" },
  suspended: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", dot: "#ef4444" },
};

function normalizeStatus(status: string) {
  return status.toLowerCase().replace(/\s+/g, "_");
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = normalizeStatus(status);
  const style = STATUS_STYLE[normalized] ?? STATUS_STYLE.active;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
      style={{ background: style.bg, color: style.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
      {status.replace("_", " ")}
    </span>
  );
}
