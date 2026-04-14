import type { AttendanceStatus } from "@/modules/attendance/types";

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
}

const STYLE: Record<AttendanceStatus, { bg: string; text: string }> = {
  PRESENT: { bg: "rgba(16,185,129,0.12)", text: "#10b981" },
  LATE: { bg: "rgba(245,158,11,0.12)", text: "#d97706" },
  ABSENT: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
  HALF_DAY: { bg: "rgba(99,102,241,0.12)", text: "#6366f1" },
  INCOMPLETE: { bg: "rgba(100,116,139,0.14)", text: "#475569" },
};

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  const style = STYLE[status];
  const label = status === "HALF_DAY"
    ? "Half Day"
    : status === "INCOMPLETE"
      ? "Incomplete"
      : status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: style.bg, color: style.text }}>
      {label}
    </span>
  );
}
