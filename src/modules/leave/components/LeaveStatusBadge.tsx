import type { LeaveStatus } from "@/modules/leave/types";
import { SemanticBadge } from "@/components/common/SemanticBadge";

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
}

/**
 * Maps leave status to semantic variant for badge coloring
 * Follows semantic meaning: warning → pending approval, success → approved, danger → rejected, neutral → cancelled
 */
function getStatusVariant(status: LeaveStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const variantMap: Record<LeaveStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
    CANCELLED: "neutral",
  };
  return variantMap[status];
}

/**
 * Gets display label for leave status
 */
function getStatusLabel(status: LeaveStatus): string {
  const labelMap: Record<LeaveStatus, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };
  return labelMap[status];
}

export function LeaveStatusBadge({ status }: LeaveStatusBadgeProps) {
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
