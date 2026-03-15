import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, FolderKanban, MessageSquareText, UserCircle2 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getTaskById } from "@/modules/tasks/services/taskService";
import { TaskPriorityBadge } from "@/modules/tasks/components/TaskPriorityBadge";
import { TaskStatusBadge } from "@/modules/tasks/components/TaskStatusBadge";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import type { Task } from "@/modules/tasks/types";

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  usePageMeta({ title: "Task Details", breadcrumb: ["Workspace", "Tasks", "Details"] });

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const resolvedError = !id ? "Invalid task id." : error;

  useEffect(() => {
    if (!id) return;

    let active = true;
    getTaskById(id)
      .then((response) => {
        if (active) setTask(response);
      })
      .catch(() => {
        if (active) setError("Unable to load task details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" to="/app/tasks">
          <ArrowLeft size={16} />
          Back
        </Button>
        {task && <Button variant="outline" to={`/app/tasks/${task.id}/edit`}>Edit Task</Button>}
      </div>

      {loading && (
        <div className="py-24 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: "#9332EA", borderLeftColor: "rgba(147,50,234,0.3)" }} />
        </div>
      )}

      {!loading && resolvedError && <ErrorBanner message={resolvedError} />}

      {!loading && !resolvedError && !task && (
        <EmptyState
          title="Task not found"
          description="The requested task does not exist."
          action={<Button variant="outline" to="/app/tasks">Go to Tasks</Button>}
        />
      )}

      {!loading && !resolvedError && task && (
        <>
          <SectionCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {task.title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {task.description || "No description provided."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoCard icon={<UserCircle2 size={16} />} label="Assignee" value={task.assigneeName || "Unassigned"} />
            <InfoCard icon={<FolderKanban size={16} />} label="Project" value={task.projectName || "No project"} />
            <InfoCard icon={<CalendarClock size={16} />} label="Due Date" value={formatDate(task.dueDate)} />
          </div>

          <SectionCard title="Comments" subtitle="Discussion thread foundation for future real-time collaboration.">
            <div className="rounded-xl border border-dashed p-6 text-center text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
              <MessageSquareText size={18} className="mx-auto mb-2" />
              Commenting support will be connected in a later phase.
            </div>
          </SectionCard>

          <SectionCard title="Activity" subtitle="Audit-style task activity timeline placeholder.">
            <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <p>Created at: {formatDateTime(task.createdAt)}</p>
              <p>Last updated: {formatDateTime(task.updatedAt)}</p>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
        <span style={{ color: "var(--color-primary-500)" }}>{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Not set";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Unknown";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
