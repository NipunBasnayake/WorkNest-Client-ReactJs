import type { TaskStatus } from "@/modules/tasks/types";
import { getTaskStatusLabel } from "@/modules/tasks/utils/taskWorkflow";
import { SemanticBadge } from "@/components/common/SemanticBadge";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

/**
 * Maps task status to semantic variant for badge coloring
 * Follows semantic meaning: info → active/in-progress, warning → review needed, danger → blocked, success → done
 */
function getStatusVariant(status: TaskStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const variantMap: Record<TaskStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    TODO: "info",
    IN_PROGRESS: "info",
    IN_REVIEW: "warning",
    BLOCKED: "danger",
    DONE: "success",
  };
  return variantMap[status];
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const variant = getStatusVariant(status);
  const label = getTaskStatusLabel(status);

  return (
    <SemanticBadge
      variant={variant}
      label={label}
      showDot={true}
    />
  );
}
