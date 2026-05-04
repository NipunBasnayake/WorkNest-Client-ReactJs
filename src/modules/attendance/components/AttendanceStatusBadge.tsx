import type { AttendanceStatus } from "@/modules/attendance/types";
import { SemanticBadge } from "@/components/common/SemanticBadge";

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
}

/**
 * Maps attendance status to semantic variant for badge coloring
 * Follows semantic meaning: success → present, danger → absent, warning → late, neutral → half-day/incomplete
 */
function getStatusVariant(status: AttendanceStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const variantMap: Record<AttendanceStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    PRESENT: "success",
    ABSENT: "danger",
    LATE: "warning",
    HALF_DAY: "neutral",
    INCOMPLETE: "neutral",
  };
  return variantMap[status];
}

/**
 * Gets display label for attendance status
 */
function getStatusLabel(status: AttendanceStatus): string {
  const labelMap: Record<AttendanceStatus, string> = {
    PRESENT: "Present",
    ABSENT: "Absent",
    LATE: "Late",
    HALF_DAY: "Half Day",
    INCOMPLETE: "Incomplete",
  };
  return labelMap[status];
}

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  const variant = getStatusVariant(status);
  const label = getStatusLabel(status);

  return (
    <SemanticBadge
      variant={variant}
      label={label}
      showDot={true}
    />
  );
}
