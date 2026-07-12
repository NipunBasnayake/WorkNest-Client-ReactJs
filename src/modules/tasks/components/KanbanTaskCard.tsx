import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, FolderKanban, ShieldCheck, User } from "lucide-react";
import { Link } from "react-router-dom";
import { getTaskStatusLabel } from "@/modules/tasks/utils/taskWorkflow";
import type { Task } from "@/modules/tasks/types";
import { tenantRoutes } from "@/utils/tenantRoutes";

interface KanbanTaskCardProps {
  task: Task;
  draggable: boolean;
  overlay?: boolean;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Not set";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function priorityTone(priority: Task["priority"]): { bg: string; text: string } {
  if (priority === "CRITICAL") return { bg: "rgba(239,68,68,0.10)", text: "#b91c1c" };
  if (priority === "HIGH") return { bg: "rgba(245,158,11,0.10)", text: "#b45309" };
  if (priority === "LOW") return { bg: "rgba(15,118,110,0.10)", text: "#0f766e" };
  return { bg: "rgba(100,116,139,0.10)", text: "#475569" };
}

const cardBackground = "color-mix(in srgb, var(--bg-surface) 94%, var(--bg-muted))";
const cardShadow = "var(--shadow-md)";
const overlayShadow = "var(--shadow-xl)";

function KanbanTaskCardComponent({ task, draggable, overlay = false }: KanbanTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !draggable || overlay,
    data: { taskId: task.id },
  });
  const tone = priorityTone(task.priority);
  const statusLabel = getTaskStatusLabel(task.status);
  const isDone = task.status === "DONE";

  const cardBody = (
    <article
      ref={setNodeRef}
      {...attributes}
      {...(draggable && !overlay ? listeners : undefined)}
      className="block rounded-xl border p-3.5 transition-all"
      style={{
        backgroundColor: cardBackground,
        borderColor: isDragging || overlay ? "var(--color-primary-500)" : "var(--border-default)",
        opacity: isDragging ? 0.4 : 1,
        cursor: draggable ? "grab" : "default",
        touchAction: draggable ? "none" : "auto",
        transform: CSS.Translate.toString(transform),
        boxShadow: isDragging || overlay ? overlayShadow : cardShadow,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {task.title}
        </p>
        <span
          className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ backgroundColor: tone.bg, color: tone.text }}
        >
          {task.priority}
        </span>
      </div>

      {isDone ? (
        <div
          className="mt-2 rounded-lg border px-2 py-1 text-[11px] font-medium"
          style={{ borderColor: "rgba(245,158,11,0.30)", backgroundColor: "rgba(245,158,11,0.08)", color: "#b45309" }}
        >
          {draggable ? "Reopen available" : "Locked when done"}
        </div>
      ) : null}

      <p className="mt-1 truncate text-xs" style={{ color: "var(--text-tertiary)" }}>
        {task.projectName || "No project"}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span
          className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1"
          style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", backgroundColor: "var(--bg-muted)" }}
        >
          {statusLabel}
        </span>
        {task.assignedTeamName ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1"
            style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", backgroundColor: "var(--bg-muted)" }}
          >
            <ShieldCheck size={11} />
            {task.assignedTeamName}
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1"
            style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", backgroundColor: "var(--bg-muted)" }}
          >
            <User size={11} />
            Individual
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
        <div className="inline-flex items-center gap-1.5 truncate">
          <User size={12} />
          {task.assigneeName || "Unassigned"}
        </div>
        <div className="inline-flex items-center gap-1.5">
          <CalendarClock size={12} />
          Due {formatDate(task.dueDate)}
        </div>
        <div className="inline-flex items-center gap-1.5 truncate">
          <FolderKanban size={12} />
          {task.projectName || "No project"}
        </div>
      </div>
    </article>
  );

  if (overlay) {
    return cardBody;
  }

  return (
    <Link to={tenantRoutes.taskDetail(task.id)} className="block no-underline">
      {cardBody}
    </Link>
  );
}

export const KanbanTaskCard = memo(KanbanTaskCardComponent, (prev, next) => {
  return (
    prev.draggable === next.draggable &&
    prev.overlay === next.overlay &&
    prev.task.id === next.task.id &&
    prev.task.status === next.task.status &&
    prev.task.priority === next.task.priority &&
    prev.task.title === next.task.title &&
    prev.task.assignedTeamName === next.task.assignedTeamName &&
    prev.task.assigneeName === next.task.assigneeName &&
    prev.task.projectName === next.task.projectName &&
    prev.task.dueDate === next.task.dueDate
  );
});
