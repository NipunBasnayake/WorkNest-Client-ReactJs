import type { TaskStatus } from "@/modules/tasks/types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const STATUS_STYLE: Record<TaskStatus, { bg: string; text: string; dot: string; label: string }> = {
  TODO: {
    bg: "rgba(99,102,241,0.12)",
    text: "#6366f1",
    dot: "#6366f1",
    label: "To Do",
  },
  IN_PROGRESS: {
    bg: "rgba(147,50,234,0.12)",
    text: "#9332EA",
    dot: "#9332EA",
    label: "In Progress",
  },
  REVIEW: {
    bg: "rgba(245,158,11,0.12)",
    text: "#d97706",
    dot: "#d97706",
    label: "Review",
  },
  COMPLETED: {
    bg: "rgba(16,185,129,0.12)",
    text: "#10b981",
    dot: "#10b981",
    label: "Completed",
  },
  BLOCKED: {
    bg: "rgba(239,68,68,0.12)",
    text: "#ef4444",
    dot: "#ef4444",
    label: "Blocked",
  },
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const style = STATUS_STYLE[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: style.bg, color: style.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
      {style.label}
    </span>
  );
}
