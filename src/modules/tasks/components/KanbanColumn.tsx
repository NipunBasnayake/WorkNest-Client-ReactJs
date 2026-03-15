import { CalendarClock, FolderKanban, User } from "lucide-react";
import { Link } from "react-router-dom";
import { TaskPriorityBadge } from "@/modules/tasks/components/TaskPriorityBadge";
import { TaskStatusBadge } from "@/modules/tasks/components/TaskStatusBadge";
import type { Task, TaskStatus } from "@/modules/tasks/types";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
}

export function KanbanColumn({ status, title, tasks }: KanbanColumnProps) {
  return (
    <section
      className="w-[300px] shrink-0 rounded-2xl border"
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
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

      <div className="space-y-3 p-3">
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
            className="block rounded-xl border p-3 no-underline transition-colors hover:bg-primary-50/30 dark:hover:bg-primary-950/10"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
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
