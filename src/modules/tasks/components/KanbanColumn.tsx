import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { getTaskStatusLabel } from "@/modules/tasks/utils/taskWorkflow";
import { KanbanTaskCard } from "@/modules/tasks/components/KanbanTaskCard";
import type { Task, TaskStatus } from "@/modules/tasks/types";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  draggableTaskIds?: ReadonlySet<string>;
}

function KanbanColumnComponent({ status, title, tasks, draggableTaskIds }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status, data: { status } });
  const statusLabel = getTaskStatusLabel(status);

  return (
    <section
      ref={setNodeRef}
      className="w-[325px] shrink-0 rounded-2xl border-2"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: isOver ? "var(--color-primary-500)" : "var(--border-default)"
      }}
    >
      <div
        className="flex items-center justify-between border-b rounded-t-2xl px-4 py-3.5"
        style={{ borderColor: "var(--border-default)", backgroundColor: "rgba(255,255,255,0.75)" }}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {title}
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            {statusLabel}
          </p>
        </div>
        <div
          className="inline-flex min-w-7 items-center justify-center rounded-md px-2 py-1 text-xs font-semibold"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
        >
          {tasks.length}
        </div>
      </div>

      <div className="space-y-3 p-3.5">
        {tasks.length === 0 && (
          <div
            className="rounded-xl border border-dashed px-3 py-9 text-center"
            style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)", backgroundColor: "var(--bg-muted)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              No tasks in this stage
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Drag a card here to update workflow.
            </p>
          </div>
        )}

        {tasks.map((task) => (
          <KanbanTaskCard key={task.id} task={task} draggable={Boolean(draggableTaskIds?.has(task.id))} />
        ))}
      </div>
    </section>
  );
}

export const KanbanColumn = memo(KanbanColumnComponent);
