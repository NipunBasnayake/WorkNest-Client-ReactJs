import type { LeaveStatus } from "@/modules/leave/types";

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
}

const STYLE: Record<LeaveStatus, { bg: string; text: string }> = {
  PENDING: { bg: "rgba(245,158,11,0.12)", text: "#d97706" },
  APPROVED: { bg: "rgba(16,185,129,0.12)", text: "#10b981" },
  REJECTED: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
  CANCELLED: { bg: "rgba(148,163,184,0.12)", text: "#64748b" },
};

export function LeaveStatusBadge({ status }: LeaveStatusBadgeProps) {
  const style = STYLE[status];

  return (
    <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: style.bg, color: style.text }}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
