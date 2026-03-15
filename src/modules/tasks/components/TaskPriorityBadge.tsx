import type { TaskPriority } from "@/modules/tasks/types";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

const PRIORITY_STYLE: Record<TaskPriority, { bg: string; text: string; label: string }> = {
  LOW: { bg: "rgba(16,185,129,0.1)", text: "#10b981", label: "Low" },
  MEDIUM: { bg: "rgba(99,102,241,0.1)", text: "#6366f1", label: "Medium" },
  HIGH: { bg: "rgba(245,158,11,0.12)", text: "#d97706", label: "High" },
  URGENT: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", label: "Urgent" },
};

export function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  const style = PRIORITY_STYLE[priority];

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}
