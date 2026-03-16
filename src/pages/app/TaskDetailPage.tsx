import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, FolderKanban, MessageSquareText, UserCircle2 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import {
  addTaskComment,
  getTaskById,
  getTaskComments,
  updateTaskDueDate,
  updateTaskPriority,
  updateTaskStatus,
} from "@/modules/tasks/services/taskService";
import { TaskPriorityBadge } from "@/modules/tasks/components/TaskPriorityBadge";
import { TaskStatusBadge } from "@/modules/tasks/components/TaskStatusBadge";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, type Task, type TaskComment, type TaskPriority, type TaskStatus } from "@/modules/tasks/types";

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  usePageMeta({ title: "Task Details", breadcrumb: ["Workspace", "Tasks", "Details"] });
  const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadingComments, setLoadingComments] = useState(Boolean(id));
  const [commentDraft, setCommentDraft] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(false);
  const [dueDateDraft, setDueDateDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const resolvedError = !id ? "Invalid task id." : error;

  useEffect(() => {
    if (!id) return;

    let active = true;
    Promise.all([getTaskById(id), getTaskComments(id).catch(() => [])])
      .then(([taskResponse, taskComments]) => {
        if (!active) return;
        setTask(taskResponse);
        setDueDateDraft(taskResponse.dueDate);
        setComments(taskComments);
      })
      .catch(() => {
        if (active) setError("Unable to load task details.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setLoadingComments(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const activityItems = useMemo<Array<{ id: string; label: string; at: string; detail?: string }>>(() => {
    if (!task) return [];
    const baseItems = [
      { id: `created-${task.id}`, label: "Task created", at: task.createdAt },
      { id: `updated-${task.id}`, label: "Task updated", at: task.updatedAt },
    ];

    const commentItems = comments.map((comment) => ({
      id: `comment-${comment.id}`,
      label: `${comment.authorName} commented`,
      detail: comment.comment,
      at: comment.createdAt,
    }));

    return [...baseItems, ...commentItems].sort((a, b) => b.at.localeCompare(a.at));
  }, [comments, task]);

  async function handleStatusChange(nextStatus: TaskStatus) {
    if (!task || nextStatus === task.status) return;
    setUpdatingTask(true);
    setFeedback(null);
    try {
      const updated = await updateTaskStatus(task.id, nextStatus);
      setTask(updated);
      setDueDateDraft(updated.dueDate);
      setFeedback("Task status updated.");
    } catch {
      setFeedback("Unable to update task status.");
    } finally {
      setUpdatingTask(false);
    }
  }

  async function handlePriorityChange(nextPriority: TaskPriority) {
    if (!task || nextPriority === task.priority) return;
    setUpdatingTask(true);
    setFeedback(null);
    try {
      const updated = await updateTaskPriority(task.id, nextPriority);
      setTask(updated);
      setDueDateDraft(updated.dueDate);
      setFeedback("Task priority updated.");
    } catch {
      setFeedback("Unable to update task priority.");
    } finally {
      setUpdatingTask(false);
    }
  }

  async function handleDueDateUpdate() {
    if (!task || !dueDateDraft || dueDateDraft === task.dueDate) return;
    setUpdatingTask(true);
    setFeedback(null);
    try {
      const updated = await updateTaskDueDate(task.id, dueDateDraft);
      setTask(updated);
      setDueDateDraft(updated.dueDate);
      setFeedback("Task due date updated.");
    } catch {
      setFeedback("Unable to update task due date.");
    } finally {
      setUpdatingTask(false);
    }
  }

  async function handleCommentSubmit() {
    if (!task || !commentDraft.trim()) return;
    setAddingComment(true);
    setFeedback(null);
    try {
      const created = await addTaskComment(task.id, commentDraft.trim());
      setComments((prev) => [...prev, created]);
      setCommentDraft("");
      setFeedback("Comment added.");
    } catch {
      setFeedback("Unable to add comment.");
    } finally {
      setAddingComment(false);
    }
  }

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

      {feedback && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: feedback.toLowerCase().includes("unable") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
            backgroundColor: feedback.toLowerCase().includes("unable") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
            color: feedback.toLowerCase().includes("unable") ? "#ef4444" : "#10b981",
          }}
        >
          {feedback}
        </div>
      )}

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

          <SectionCard title="Workflow Controls" subtitle="Manage lifecycle fields using task patch endpoints.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FieldSelect
                id="task-detail-status"
                label="Status"
                value={task.status}
                options={TASK_STATUS_OPTIONS}
                disabled={updatingTask}
                onChange={(value) => handleStatusChange(value as TaskStatus)}
              />
              <FieldSelect
                id="task-detail-priority"
                label="Priority"
                value={task.priority}
                options={TASK_PRIORITY_OPTIONS}
                disabled={updatingTask}
                onChange={(value) => handlePriorityChange(value as TaskPriority)}
              />
              <div className="space-y-1.5">
                <label htmlFor="task-detail-due-date" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Due Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="task-detail-due-date"
                    type="date"
                    value={dueDateDraft}
                    onChange={(event) => setDueDateDraft(event.target.value)}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
                  />
                  <Button size="sm" variant="outline" disabled={updatingTask || dueDateDraft === task.dueDate} onClick={handleDueDateUpdate}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Comments" subtitle="Collaborate on task execution updates.">
            <div className="space-y-4">
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}>
                <textarea
                  rows={3}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Add implementation notes, blockers, or progress updates..."
                  className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Commenting as {user?.name ?? "Current user"}
                  </span>
                  <Button size="sm" variant="primary" disabled={addingComment || !commentDraft.trim()} onClick={handleCommentSubmit}>
                    {addingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>

              {loadingComments && (
                <div className="rounded-xl border border-dashed p-4 text-center text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
                  Loading comments...
                </div>
              )}

              {!loadingComments && comments.length === 0 && (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
                  <MessageSquareText size={18} className="mx-auto mb-2" />
                  No comments yet. Start the conversation.
                </div>
              )}

              {!loadingComments && comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border-default)" }}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {comment.authorName}
                        </p>
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                        {comment.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Activity" subtitle="Task lifecycle and collaboration timeline.">
            <div className="space-y-3">
              {activityItems.map((entry) => (
                <div key={entry.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {entry.label}
                  </p>
                  {entry.detail && (
                    <p className="mt-1 text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                      {entry.detail}
                    </p>
                  )}
                  <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {formatDateTime(entry.at)}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

function FieldSelect({
  id,
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60"
        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace("_", " ")}
          </option>
        ))}
      </select>
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
