import type { TaskPriority } from "@/modules/tasks/types";
import { SemanticBadge } from "@/components/common/SemanticBadge";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

/**
 * Maps task priority to semantic variant for badge coloring
 * Follows semantic meaning: success → low priority, info → medium priority, warning → high priority, danger → critical
 */
function getPriorityVariant(priority: TaskPriority): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const variantMap: Record<TaskPriority, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    LOW: "success",
    MEDIUM: "info",
    HIGH: "warning",
    CRITICAL: "danger",
  };
  return variantMap[priority];
}

/**
 * Gets display label for priority
 */
function getPriorityLabel(priority: TaskPriority): string {
  const labelMap: Record<TaskPriority, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  };
  return labelMap[priority];
}

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  const variant = getPriorityVariant(priority);
  const label = getPriorityLabel(priority);

  return (
    <SemanticBadge
      variant={variant}
      label={label}
      showDot={false}
    />
  );
}
