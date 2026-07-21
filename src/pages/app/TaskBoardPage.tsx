import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { LayoutGrid, PlusCircle, Table2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { invalidateWorkflowQueries } from "@/hooks/queries/workflowInvalidation";
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
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, type Task, type TaskStatus } from "@/modules/tasks/types";
import { canMoveTaskToStatus, getTaskAllowedStatuses, getTaskStatusLabel, hasTeamWorkflowAccess } from "@/modules/tasks/utils/taskWorkflow";
import { persistTasksViewPreference, resolveTasksViewFromQuery } from "@/modules/tasks/utils/tasksViewPreference";
import { subscribeTaskRealtime } from "@/modules/tasks/services/taskRealtimeService";
import { resolveViewerTeamRoles } from "@/modules/teams/utils/teamRoles";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import { AppSelect } from "@/components/common/AppSelect";
import { SearchField } from "@/components/common/SearchField";
import { InlineAlert } from "@/components/common/InlineAlert";
import { getErrorMessage } from "@/utils/errorHandler";
import { tenantRoutes } from "@/utils/tenantRoutes";

function toLabel(value: string): string {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function TaskBoardPage() {
  usePageMeta({ title: "Task Management", breadcrumb: ["Workspace", "Tasks"] });
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const { hasPermission } = usePermission();

  const canManageTasks = hasPermission(PERMISSIONS.TASKS_MANAGE);
  const roleValue = String(role ?? "");
  const hasGlobalTaskWorkflow = roleValue === "TENANT_ADMIN" || roleValue === "ADMIN";
  const needsScopedWorkflowContext = !hasGlobalTaskWorkflow;
  const myTeamsQuery = useMyTeamsQuery(needsScopedWorkflowContext);

  const [viewerIdentity, setViewerIdentity] = useState<TaskViewerIdentity | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning" | "error" | "info"; message: string } | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const realtimeRefetchTimerRef = useRef<number | null>(null);
  const taskRequestRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 2 },
    })
  );

  const fetchTasks = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    const requestId = ++taskRequestRef.current;

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const identity = needsScopedWorkflowContext ? await resolveTaskViewerIdentity() : null;
      const scopedRoles = resolveViewerTeamRoles(
        myTeamsQuery.data ?? [],
        {
          employeeId: identity?.employeeId ?? user?.id,
          email: identity?.email ?? user?.email,
        }
      );
      const selfOnly = role === "EMPLOYEE" && !canManageTasks && !hasTeamWorkflowAccess(scopedRoles);
      const data = await (selfOnly ? getMyTasks() : getTasks());
      if (requestId !== taskRequestRef.current) return;
      setTasks(data);
      setViewerIdentity(identity);
    } catch (err: unknown) {
      if (!silent && requestId === taskRequestRef.current) {
        setError(getErrorMessage(err, "Unable to load board tasks."));
      }
    } finally {
      if (requestId === taskRequestRef.current) {
        setLoading(false);
      }
    }
  }, [canManageTasks, myTeamsQuery.data, needsScopedWorkflowContext, role, user?.email, user?.id]);

  useEffect(() => () => {
    taskRequestRef.current += 1;
  }, []);

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

  const employeeTeams = useMemo(() => myTeamsQuery.data ?? [], [myTeamsQuery.data]);
  const viewerScopedTeamRoles = useMemo(
    () => resolveViewerTeamRoles(employeeTeams, {
      employeeId: viewerIdentity?.employeeId ?? user?.id,
      email: viewerIdentity?.email ?? user?.email,
    }),
    [employeeTeams, user?.email, user?.id, viewerIdentity?.email, viewerIdentity?.employeeId]
  );
  const isSelfOnlyBoard = role === "EMPLOYEE" && !canManageTasks && !hasTeamWorkflowAccess(viewerScopedTeamRoles);
  const canCreateScopedTask = hasGlobalTaskWorkflow || hasTeamWorkflowAccess(viewerScopedTeamRoles);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch = !query || [task.title, task.description || "", task.assigneeName || "", task.assignedTeamName || "", task.projectName || ""]
        .some((value) => value.toLowerCase().includes(query));
      const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;
      const matchesProject = projectFilter === "ALL" || task.projectId === projectFilter;
      return matchesSearch && matchesPriority && matchesProject;
    });
  }, [priorityFilter, projectFilter, search, tasks]);

  const projectOptions = useMemo(() => {
    const options = new Map<string, string>();
    tasks.forEach((task) => {
      if (task.projectId) options.set(task.projectId, task.projectName || `Project ${task.projectId}`);
    });
    return [...options.entries()].sort((left, right) => left[1].localeCompare(right[1]));
  }, [tasks]);

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
    const teamRoles = task.assignedTeamId
      ? resolveViewerTeamRoles(
          employeeTeams,
          { employeeId: viewerIdentity?.employeeId, email: viewerIdentity?.email },
          [task.assignedTeamId]
        )
      : [];
    const isDirectAssignee = Boolean(viewerIdentity && isTaskAssignedToViewer(task, viewerIdentity));
    const allowedStatuses = getTaskAllowedStatuses(
      task,
      hasGlobalTaskWorkflow ? "TENANT_ADMIN" : role,
      teamRoles,
      isDirectAssignee
    );

    if (!allowedStatuses.some((status) => status !== task.status)) {
      return false;
    }

    if (hasGlobalTaskWorkflow) return true;
    return Boolean(viewerIdentity);
  }, [employeeTeams, hasGlobalTaskWorkflow, role, viewerIdentity]);

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

  const handleDragCancel = useCallback(() => {
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

    if (!canMoveTaskToStatus(current, hasGlobalTaskWorkflow ? "TENANT_ADMIN" : role, teamRoles, isDirectAssignee, nextStatus)) {
      setFeedback({ tone: "warning", message: "This status transition is restricted for your role." });
      return;
    }

    const previousStatus = current.status;
    setFeedback(null);
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)));

    try {
      const updated = await updateTaskStatus(taskId, nextStatus);
      await invalidateWorkflowQueries(queryClient, ["tasks"]);
      setTasks((prev) => {
        const next = new Map(prev.map((task) => [task.id, task]));
        next.set(updated.id, updated);
        return Array.from(next.values());
      });
      setFeedback({ tone: "success", message: `Task moved to ${getTaskStatusLabel(nextStatus)}.` });
    } catch (err: unknown) {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: previousStatus } : task)));
      setFeedback({ tone: "error", message: getErrorMessage(err, "Unable to move task right now.") });
    }
  }, [employeeTeams, hasGlobalTaskWorkflow, queryClient, role, tasks, viewerIdentity]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={isSelfOnlyBoard ? "My Tasks" : "Task Management"}
        description={isSelfOnlyBoard ? "Track your assigned tasks by workflow stage." : "Visualize tasks by workflow stage and quickly spot bottlenecks."}
        actions={(
          canCreateScopedTask ? (
            <Button variant="primary" to={tenantRoutes.taskCreate()}>
              <PlusCircle size={16} />
              Create Task
            </Button>
          ) : undefined
        )}
      />

      <SectionCard variant="dense">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
          <SearchField
            label="Search board tasks"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter cards by task, team, project, or assignee..."
            className="w-full sm:w-72"
          />
          <AppSelect value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="min-w-40 flex-1 sm:flex-none">
            <option value="ALL">All Priorities</option>
            {TASK_PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{toLabel(priority)}</option>)}
          </AppSelect>
          <AppSelect value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="min-w-40 flex-1 sm:flex-none">
            <option value="ALL">All Projects</option>
            {projectOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </AppSelect>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto" aria-label="Task view">
            <Button type="button" variant="primary" size="sm" aria-current="page">
              <LayoutGrid size={16} />
              Board View
            </Button>
            <Button variant="outline" size="sm" to={`${tenantRoutes.tasks()}?view=list`}>
              <Table2 size={16} />
              Table View
            </Button>
          </div>
        </div>
      </SectionCard>

      {error && <ErrorBanner message={error} onRetry={() => void fetchTasks()} />}

      {feedback && (
        <InlineAlert tone={feedback.tone} message={feedback.message} />
      )}

      {loading && (
        <SectionCard>
          <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        </SectionCard>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title={search || priorityFilter !== "ALL" || projectFilter !== "ALL" ? "No matching board cards" : "No tasks available"}
          description={search || priorityFilter !== "ALL" || projectFilter !== "ALL" ? "Adjust your search or filters to see matching tasks." : (isSelfOnlyBoard ? "No tasks are assigned to you right now." : "Create tasks to start using the Kanban board.")}
          action={canCreateScopedTask ? <Button variant="outline" to={tenantRoutes.taskCreate()}>Create Task</Button> : undefined}
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
          <div className="overflow-x-auto pb-1" style={{ scrollBehavior: "smooth" }}>
            <div className="flex min-w-max gap-4">
              {TASK_STATUS_OPTIONS.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
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
