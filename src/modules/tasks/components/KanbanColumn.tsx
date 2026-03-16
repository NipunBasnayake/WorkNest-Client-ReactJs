import { useState } from "react";
import { CalendarClock, FolderKanban, User } from "lucide-react";
import { Link } from "react-router-dom";
import { TaskPriorityBadge } from "@/modules/tasks/components/TaskPriorityBadge";
import { TaskStatusBadge } from "@/modules/tasks/components/TaskStatusBadge";
import type { Task, TaskStatus } from "@/modules/tasks/types";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onMoveTask?: (taskId: string, nextStatus: TaskStatus) => void;
  movingTaskId?: string | null;
}

export function KanbanColumn({ status, title, tasks, onMoveTask, movingTaskId }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDrop(taskId: string) {
    if (!onMoveTask) return;
    onMoveTask(taskId, status);
    setIsDragOver(false);
  }

  return (
    <section
      className="w-[300px] shrink-0 rounded-2xl border"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: isDragOver ? "rgba(147,50,234,0.45)" : "var(--border-default)",
        boxShadow: isDragOver ? "0 0 0 2px rgba(147,50,234,0.18) inset" : undefined,
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
      >
        <div className="flex items-center gap-2">
          <TaskStatusBadge status={status} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
            {title}
          </span>
        </div>
        <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
          {tasks.length}
        </span>
      </div>

      <div
        className="space-y-3 p-3"
        onDragOver={(event) => {
          if (!onMoveTask) return;
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(event) => {
          if (!onMoveTask) return;
          event.preventDefault();
          const taskId = event.dataTransfer.getData("application/worknest-task-id");
          if (taskId) handleDrop(taskId);
        }}
      >
        {tasks.length === 0 && (
          <div
            className="rounded-xl border border-dashed px-3 py-8 text-center text-xs"
            style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}
          >
            No tasks in this stage.
          </div>
        )}

        {tasks.map((task) => (
          <Link
            key={task.id}
            to={`/app/tasks/${task.id}`}
            draggable={Boolean(onMoveTask)}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("application/worknest-task-id", task.id);
            }}
            className="block rounded-xl border p-3 no-underline transition-colors hover:bg-primary-50/30 dark:hover:bg-primary-950/10"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: movingTaskId === task.id ? "rgba(147,50,234,0.5)" : "var(--border-default)",
              opacity: movingTaskId === task.id ? 0.6 : 1,
              cursor: onMoveTask ? "grab" : "pointer",
            }}
          >
            <p className="line-clamp-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {task.title}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <TaskPriorityBadge priority={task.priority} />
            </div>

            <div className="mt-3 space-y-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
              <div className="inline-flex items-center gap-1.5">
                <User size={12} />
                {task.assigneeName || "Unassigned"}
              </div>
              <div className="inline-flex items-center gap-1.5">
                <CalendarClock size={12} />
                Due {formatDate(task.dueDate)}
              </div>
              <div className="inline-flex items-center gap-1.5">
                <FolderKanban size={12} />
                {task.projectName || "No project"}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Not set";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
