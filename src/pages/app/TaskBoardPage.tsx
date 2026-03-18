import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import {
  filterTasksForViewer,
  getTasks,
  hasTaskViewerIdentity,
  isTaskAssignedToViewer,
  resolveTaskViewerIdentity,
  updateTaskStatus,
  type TaskViewerIdentity,
} from "@/modules/tasks/services/taskService";
import { KanbanColumn } from "@/modules/tasks/components/KanbanColumn";
import { TASK_STATUS_OPTIONS, type Task, type TaskStatus } from "@/modules/tasks/types";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";

const BOARD_LABELS: Record<typeof TASK_STATUS_OPTIONS[number], string> = {
  TODO: "Backlog",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  BLOCKED: "Blocked",
  DONE: "Done",
};

type EmployeeStatusFlow = Extract<TaskStatus, "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE">;
const EMPLOYEE_STATUS_OPTIONS: EmployeeStatusFlow[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const EMPLOYEE_STATUS_SET = new Set<TaskStatus>(EMPLOYEE_STATUS_OPTIONS);

export function TaskBoardPage() {
  usePageMeta({ title: "Task Board", breadcrumb: ["Workspace", "Tasks", "Board"] });
  const { hasRole, user } = useAuth();

  const canManageTasks = hasRole("TENANT_ADMIN", "ADMIN", "MANAGER");
  const isEmployeeOnly = hasRole("EMPLOYEE") && !canManageTasks;

  const [viewerIdentity, setViewerIdentity] = useState<TaskViewerIdentity | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function fetchTasks() {
    setLoading(true);
    setError(null);
    try {
      const identityPromise = isEmployeeOnly ? resolveTaskViewerIdentity() : Promise.resolve(null);
      const [data, identity] = await Promise.all([getTasks(), identityPromise]);
      setTasks(data);
      setViewerIdentity(identity);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) ?? "Unable to load board tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchTasks();
  }, [isEmployeeOnly, user?.id]);

  const scopedTasks = useMemo(() => {
    if (!isEmployeeOnly) return tasks;
    return filterTasksForViewer(tasks, viewerIdentity);
  }, [isEmployeeOnly, tasks, viewerIdentity]);

  const identityResolved = !isEmployeeOnly || hasTaskViewerIdentity(viewerIdentity);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return scopedTasks;
    return scopedTasks.filter((task) =>
      [task.title, task.description || "", task.assigneeName || "", task.projectName || ""]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [search, scopedTasks]);

  const grouped = useMemo(() => {
    return TASK_STATUS_OPTIONS.reduce<Record<typeof TASK_STATUS_OPTIONS[number], Task[]>>((acc, status) => {
      acc[status] = filtered.filter((task) => task.status === status);
      return acc;
    }, {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      BLOCKED: [],
      DONE: [],
    });
  }, [filtered]);

  const canDragTask = (task: Task): boolean => {
    if (canManageTasks) return true;
    return isEmployeeOnly && isTaskAssignedToViewer(task, viewerIdentity);
  };

  async function handleMoveTask(taskId: string, nextStatus: typeof TASK_STATUS_OPTIONS[number]) {
    const current = tasks.find((task) => task.id === taskId);
    if (!current || current.status === nextStatus) return;

    const canMove = canManageTasks || (isEmployeeOnly && isTaskAssignedToViewer(current, viewerIdentity));
    if (!canMove) return;

    if (!canManageTasks && !EMPLOYEE_STATUS_SET.has(nextStatus)) {
      setFeedback("This status transition is restricted for your role.");
      return;
    }

    setMovingTaskId(taskId);
    setFeedback(null);
    try {
      const updated = await updateTaskStatus(taskId, nextStatus);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
      setFeedback(`Task moved to ${BOARD_LABELS[nextStatus]}.`);
    } catch (err: unknown) {
      setFeedback(extractErrorMessage(err) ?? "Unable to move task right now.");
    } finally {
      setMovingTaskId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployeeOnly ? "My Task Board" : "Kanban Board"}
        description={isEmployeeOnly ? "Track your assigned tasks by workflow stage." : "Visualize tasks by workflow stage and quickly spot bottlenecks."}
        actions={(
          <Button variant="ghost" to="/app/tasks">
            <ArrowLeft size={16} />
            Back to List
          </Button>
        )}
      />

      <SectionCard>
        <div className="relative max-w-lg">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter cards by task, project, or assignee..."
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>
      </SectionCard>

      {error && <ErrorBanner message={error} onRetry={fetchTasks} />}
      {!error && isEmployeeOnly && !identityResolved && (
        <ErrorBanner
          message="Unable to resolve your employee identity for task scoping. Please refresh or contact your workspace admin."
          onRetry={fetchTasks}
        />
      )}

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

      {loading && (
        <SectionCard>
          <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        </SectionCard>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title={search ? "No matching board cards" : "No tasks available"}
          description={search ? "Adjust your search to see matching tasks." : (isEmployeeOnly ? "No tasks are assigned to you right now." : "Create tasks to start using the Kanban board.")}
          action={canManageTasks ? <Button variant="outline" to="/app/tasks/new">Create Task</Button> : undefined}
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-4">
            {TASK_STATUS_OPTIONS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                title={BOARD_LABELS[status]}
                tasks={grouped[status]}
                onMoveTask={(taskId, nextStatus) => void handleMoveTask(taskId, nextStatus)}
                canDragTask={canDragTask}
                movingTaskId={movingTaskId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function extractErrorMessage(err: unknown): string | null {
  if (typeof err === "object" && err !== null) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    return error.response?.data?.message ?? error.message ?? null;
  }
  return null;
}
