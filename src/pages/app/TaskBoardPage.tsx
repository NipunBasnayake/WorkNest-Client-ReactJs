import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Search, Table2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { useMyTeamsQuery } from "@/hooks/queries/useCoreQueries";
import {
  getMyTasks,
  getTasks,
  isTaskAssignedToViewer,
  normalizeTaskFromUnknown,
  resolveTaskViewerIdentity,
  updateTaskStatus,
  type TaskViewerIdentity,
} from "@/modules/tasks/services/taskService";
import { KanbanColumn } from "@/modules/tasks/components/KanbanColumn";
import { KanbanTaskCard } from "@/modules/tasks/components/KanbanTaskCard";
import { TASK_STATUS_OPTIONS, type Task, type TaskStatus } from "@/modules/tasks/types";
import { canMoveTaskToStatus, hasTeamWorkflowAccess } from "@/modules/tasks/utils/taskWorkflow";
import { persistTasksViewPreference, resolveTasksViewFromQuery } from "@/modules/tasks/utils/tasksViewPreference";
import { subscribeTaskRealtime } from "@/modules/tasks/services/taskRealtimeService";
import { resolveViewerTeamRoles } from "@/modules/teams/utils/teamRoles";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import { getErrorMessage } from "@/utils/errorHandler";

const BOARD_LABELS: Record<typeof TASK_STATUS_OPTIONS[number], string> = {
  TODO: "Backlog",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "Waiting for Admin Review",
  BLOCKED: "Blocked",
  DONE: "Done",
};

export function TaskBoardPage() {
  usePageMeta({ title: "Task Management", breadcrumb: ["Workspace", "Tasks"] });
  const { role } = useAuth();
  const { hasPermission } = usePermission();

  const canManageTasks = hasPermission(PERMISSIONS.TASKS_MANAGE);
  const isEmployeeOnly = role === "EMPLOYEE" && !canManageTasks;
  const myTeamsQuery = useMyTeamsQuery(isEmployeeOnly);

  const [viewerIdentity, setViewerIdentity] = useState<TaskViewerIdentity | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const realtimeRefetchTimerRef = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 2 },
    })
  );

  const fetchTasks = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const identityPromise = isEmployeeOnly ? resolveTaskViewerIdentity() : Promise.resolve(null);
      const taskPromise = isEmployeeOnly ? getMyTasks() : getTasks();
      const [data, identity] = await Promise.all([taskPromise, identityPromise]);
      setTasks(data);
      setViewerIdentity(identity);
    } catch (err: unknown) {
      if (!silent) {
        setError(getErrorMessage(err, "Unable to load board tasks."));
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [isEmployeeOnly]);

  useEffect(() => {
    const preferredView = resolveTasksViewFromQuery(searchParams.get("view"));
    if (preferredView !== "board") {
      const next = new URLSearchParams(searchParams);
      next.set("view", "board");
      setSearchParams(next, { replace: true });
    }
    persistTasksViewPreference("board");
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks, role]);

  useEffect(() => {
    const scheduleReconcile = () => {
      if (realtimeRefetchTimerRef.current) {
        window.clearTimeout(realtimeRefetchTimerRef.current);
      }

      realtimeRefetchTimerRef.current = window.setTimeout(() => {
        void fetchTasks({ silent: true });
      }, 300);
    };

    const unsubscribe = subscribeTaskRealtime((payload) => {
      try {
        const incoming = normalizeTaskFromUnknown(payload);
        setTasks((prev) => {
          const next = new Map(prev.map((task) => [task.id, task]));
          const current = next.get(incoming.id);
          next.set(incoming.id, current ? { ...current, ...incoming } : incoming);
          return Array.from(next.values());
        });
      } catch {
        // Ignore non-task payloads on shared topics and reconcile via fetch.
      }

      scheduleReconcile();
    });

    return () => {
      unsubscribe();
      if (realtimeRefetchTimerRef.current) {
        window.clearTimeout(realtimeRefetchTimerRef.current);
      }
    };
  }, [fetchTasks]);

  const employeeTeams = myTeamsQuery.data ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter((task) =>
      [task.title, task.description || "", task.assigneeName || "", task.assignedTeamName || "", task.projectName || ""]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [search, tasks]);

  const grouped = useMemo(() => {
    const buckets: Record<typeof TASK_STATUS_OPTIONS[number], Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      BLOCKED: [],
      DONE: [],
    };

    for (const task of filtered) {
      buckets[task.status].push(task);
    }

    return buckets;
  }, [filtered]);

  const canDragTask = useCallback((task: Task): boolean => {
    if (canManageTasks) return true;
    if (!isEmployeeOnly || !viewerIdentity) return false;

    if (task.assignedTeamId) {
      const teamRoles = resolveViewerTeamRoles(
        employeeTeams,
        { employeeId: viewerIdentity.employeeId, email: viewerIdentity.email },
        [task.assignedTeamId]
      );
      return hasTeamWorkflowAccess(teamRoles);
    }

    return isTaskAssignedToViewer(task, viewerIdentity);
  }, [canManageTasks, employeeTeams, isEmployeeOnly, viewerIdentity]);

  const draggableTaskIds = useMemo(() => {
    const ids = new Set<string>();
    for (const task of filtered) {
      if (canDragTask(task)) {
        ids.add(task.id);
      }
    }
    return ids;
  }, [canDragTask, filtered]);

  const activeTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, tasks]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
  }, []);

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    setActiveTaskId(null);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveTaskId(null);
    const taskId = String(event.active.id);
    const nextStatus = event.over?.id as TaskStatus | undefined;
    if (!nextStatus) return;

    const current = tasks.find((task) => task.id === taskId);
    if (!current || current.status === nextStatus) return;

    const teamRoles = current.assignedTeamId
      ? resolveViewerTeamRoles(
          employeeTeams,
          { employeeId: viewerIdentity?.employeeId, email: viewerIdentity?.email },
          [current.assignedTeamId]
        )
      : [];
    const isDirectAssignee = Boolean(viewerIdentity && isTaskAssignedToViewer(current, viewerIdentity));

    if (!canMoveTaskToStatus(current, role, teamRoles, isDirectAssignee, nextStatus)) {
      setFeedback("This status transition is restricted for your role.");
      return;
    }

    const previousStatus = current.status;
    setFeedback(null);
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)));

    try {
      const updated = await updateTaskStatus(taskId, nextStatus);
      setTasks((prev) => {
        const next = new Map(prev.map((task) => [task.id, task]));
        next.set(updated.id, updated);
        return Array.from(next.values());
      });
      setFeedback(`Task moved to ${BOARD_LABELS[nextStatus]}.`);
    } catch (err: unknown) {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: previousStatus } : task)));
      setFeedback(getErrorMessage(err, "Unable to move task right now."));
    }
  }, [employeeTeams, role, tasks, viewerIdentity]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployeeOnly ? "My Tasks" : "Task Management"}
        description={isEmployeeOnly ? "Track your assigned tasks by workflow stage." : "Visualize tasks by workflow stage and quickly spot bottlenecks."}
        actions={(
          <Button variant="outline" to="/app/tasks?view=list">
            <Table2 size={16} />
            Table View
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
            placeholder="Filter cards by task, team, project, or assignee..."
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>
      </SectionCard>

      {error && <ErrorBanner message={error} onRetry={() => void fetchTasks()} />}

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-2" style={{ scrollBehavior: "smooth" }}>
            <div className="flex min-w-max gap-4">
              {TASK_STATUS_OPTIONS.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  title={BOARD_LABELS[status]}
                  tasks={grouped[status]}
                  draggableTaskIds={draggableTaskIds}
                />
              ))}
            </div>
          </div>
          <DragOverlay>
            {activeTask ? <KanbanTaskCard task={activeTask} draggable={false} overlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
