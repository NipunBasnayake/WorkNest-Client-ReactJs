export function RecruitmentStatusBadge({ value }: { value: string }) {
  const tone = getTone(value);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
      style={{ background: TONE_STYLE[tone].bg, color: TONE_STYLE[tone].text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: TONE_STYLE[tone].dot }} />
      {value.replaceAll("_", " ")}
    </span>
  );
}

const TONE_STYLE: Record<ReturnType<typeof getTone>, { bg: string; text: string; dot: string }> = {
  neutral: { bg: "rgba(148,163,184,0.12)", text: "#64748b", dot: "#64748b" },
  success: { bg: "rgba(16,185,129,0.1)", text: "#10b981", dot: "#10b981" },
  warning: { bg: "rgba(245,158,11,0.12)", text: "#d97706", dot: "#d97706" },
  danger: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", dot: "#ef4444" },
  info: { bg: "rgba(37,99,235,0.1)", text: "#2563eb", dot: "#2563eb" },
};

function getTone(value: string): "neutral" | "success" | "warning" | "danger" | "info" {
  const normalized = value.toUpperCase();
  if (normalized === "HIRED" || normalized === "OPEN" || normalized === "COMPLETED") return "success";
  if (normalized === "OFFERED" || normalized === "INTERVIEW" || normalized === "SCHEDULED" || normalized === "SCREENING") return "info";
  if (normalized === "PAUSED" || normalized === "HR_REVIEW" || normalized === "RESCHEDULED") return "warning";
  if (normalized === "REJECTED" || normalized === "CANCELLED") return "danger";
  return "neutral";
}