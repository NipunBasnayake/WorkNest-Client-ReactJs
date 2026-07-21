import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, PlusCircle, Table2, Trash2 } from "lucide-react";
import { FiEdit2, FiEye, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { invalidateWorkflowQueries } from "@/hooks/queries/workflowInvalidation";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/hooks/useAuth";
import { useMyEmployeeProfileQuery, useMyTeamsQuery } from "@/hooks/queries/useCoreQueries";
import {
  deleteTask,
  getTasks,
  isTaskAssignedToViewer,
  updateTaskStatus,
} from "@/modules/tasks/services/taskService";
import { TaskPriorityBadge } from "@/modules/tasks/components/TaskPriorityBadge";
import { TaskStatusBadge } from "@/modules/tasks/components/TaskStatusBadge";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, type Task, type TaskStatus } from "@/modules/tasks/types";
import { getEmployees } from "@/modules/employees/services/employeeService";
import { getEmployeeDisplayName } from "@/modules/employees/utils/employeeMapper";
import { getProjects } from "@/modules/projects/services/projectService";
import { resolveViewerTeamRoles } from "@/modules/teams/utils/teamRoles";
import { getTaskAllowedStatuses, hasTeamWorkflowAccess } from "@/modules/tasks/utils/taskWorkflow";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { InlineAlert } from "@/components/common/InlineAlert";
import { SearchField } from "@/components/common/SearchField";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { getErrorMessage } from "@/utils/errorHandler";
import { tenantRoutes } from "@/utils/tenantRoutes";
import { Pagination } from "@/components/common/Pagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import { ReadOnlyIndicator } from "@/components/common/ReadOnlyIndicator";

interface Option {
  id: string;
  label: string;
}

function toLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function TasksPage() {
  usePageMeta({ title: "Tasks", breadcrumb: ["Workspace", "Tasks"] });
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const { hasPermission } = usePermission();
  const canViewEmployeeDirectory = hasPermission(PERMISSIONS.EMPLOYEES_VIEW);
  const roleValue = String(role ?? "");
  const hasGlobalTaskManagement = roleValue === "TENANT_ADMIN" || roleValue === "ADMIN";
  const needsScopedTaskContext = role === "EMPLOYEE" || role === "MANAGER";
  const viewerProfileQuery = useMyEmployeeProfileQuery(needsScopedTaskContext);
  const myTeamsQuery = useMyTeamsQuery(needsScopedTaskContext);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning" | "error" | "info"; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | typeof TASK_PRIORITY_OPTIONS[number]>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const employeePromise = canViewEmployeeDirectory ? getEmployees().catch(() => []) : Promise.resolve([]);
      const [taskRes, employeeRes, projectRes] = await Promise.all([
        getTasks(),
        employeePromise,
        getProjects().catch(() => []),
      ]);

      setTasks(taskRes);
      setAssignees(employeeRes.map((employee) => ({ id: employee.id, label: getEmployeeDisplayName(employee) })));
      setProjects(projectRes.map((project) => ({ id: project.id, label: project.name })));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load tasks."));
    } finally {
      setLoading(false);
    }
  }, [canViewEmployeeDirectory]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, role, user?.id]);

  const viewerIdentity = useMemo(
    () => ({
      employeeId: viewerProfileQuery.data?.id ?? user?.id,
      email: viewerProfileQuery.data?.email ?? user?.email,
    }),
    [user?.email, user?.id, viewerProfileQuery.data?.email, viewerProfileQuery.data?.id]
  );

  const employeeTeams = myTeamsQuery.data ?? [];
  const viewerScopedTeamRoles = resolveViewerTeamRoles(employeeTeams, viewerIdentity);
  const hasScopedCoordinatorAccess = hasTeamWorkflowAccess(viewerScopedTeamRoles);
  const isSelfOnlyTaskView = role === "EMPLOYEE" && !hasGlobalTaskManagement && !hasScopedCoordinatorAccess;
  const canCreateScopedTask = hasGlobalTaskManagement || hasScopedCoordinatorAccess;

  const getTaskTeamRoles = (task: Task) => task.assignedTeamId
    ? resolveViewerTeamRoles(employeeTeams, viewerIdentity, [task.assignedTeamId])
    : [];

  const isTaskProjectManager = (task: Task): boolean => getTaskTeamRoles(task).includes("PROJECT_MANAGER");

  const canManageTaskRecord = (task: Task): boolean => hasGlobalTaskManagement || isTaskProjectManager(task);

  const canUpdateTaskStatus = (task: Task): boolean => {
    const teamRoles = getTaskTeamRoles(task);
    const statusOptions = getTaskAllowedStatuses(
      task,
      hasGlobalTaskManagement ? "TENANT_ADMIN" : role,
      teamRoles,
      isTaskAssignedToViewer(task, viewerIdentity)
    );
    return statusOptions.some((status) => status !== task.status);
  };

  const scopedTasks = tasks;

  const filtered = useMemo(() => {
    const effectiveAssigneeFilter = isSelfOnlyTaskView ? "ALL" : assigneeFilter;
    const query = search.trim().toLowerCase();

    return scopedTasks.filter((task) => {
      const matchesQuery =
        !query ||
        [task.title, task.description || "", task.assigneeName || "", task.assignedTeamName || "", task.projectName || ""]
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;
      const matchesAssignee =
        effectiveAssigneeFilter === "ALL" ||
        task.assigneeId === effectiveAssigneeFilter ||
        task.assigneeEmployeeId === effectiveAssigneeFilter ||
        task.assigneeUserId === effectiveAssigneeFilter;
      const matchesProject = projectFilter === "ALL" || task.projectId === projectFilter;
      const matchesTeam = teamFilter === "ALL" || task.assignedTeamId === teamFilter;
      return matchesQuery && matchesStatus && matchesPriority && matchesAssignee && matchesProject && matchesTeam;
    });
  }, [
    assigneeFilter,
    isSelfOnlyTaskView,
    priorityFilter,
    projectFilter,
    scopedTasks,
    search,
    statusFilter,
    teamFilter,
  ]);
  const taskPagination = useClientPagination(filtered, {
    storageKey: "tasks",
    resetKey: `${search}|${statusFilter}|${priorityFilter}|${assigneeFilter}|${projectFilter}|${teamFilter}`,
  });

  const teamOptions = useMemo<Option[]>(() => {
    const optionMap = new Map<string, Option>();
    tasks.forEach((task) => {
      if (!task.assignedTeamId) return;
      optionMap.set(task.assignedTeamId, {
        id: task.assignedTeamId,
        label: task.assignedTeamName || `Team ${task.assignedTeamId}`,
      });
    });
    return Array.from(optionMap.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [tasks]);

  async function handleDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.status === "DONE") {
      setFeedback({ tone: "warning", message: "DONE tasks are locked. Reopen the task before deleting it." });
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    setFeedback(null);
    try {
      await deleteTask(deleteTarget.id);
      setTasks((prev) => prev.filter((task) => task.id !== deleteTarget.id));
      await invalidateWorkflowQueries(queryClient, ["tasks"]);
      setDeleteTarget(null);
      setFeedback({ tone: "success", message: "Task deleted successfully." });
    } catch (err: unknown) {
      setFeedback({ tone: "error", message: getErrorMessage(err, "Could not delete task right now.") });
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const target = tasks.find((task) => task.id === taskId);
    if (!target) return;

    const canUpdate = canUpdateTaskStatus(target);
    if (!canUpdate) return;

    try {
      const updated = await updateTaskStatus(taskId, status);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
      await invalidateWorkflowQueries(queryClient, ["tasks"]);
      setFeedback({ tone: "success", message: `Task moved to ${toLabel(status)}.` });
    } catch (err: unknown) {
      setFeedback({ tone: "error", message: getErrorMessage(err, "Unable to update task status.") });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isSelfOnlyTaskView ? "My Tasks" : "Task Management"}
        description={loading ? "Loading tasks..." : `${filtered.length} task${filtered.length === 1 ? "" : "s"} in workflow.`}
        actions={(
          canCreateScopedTask ? (
            <Button variant="primary" to={tenantRoutes.taskCreate()}>
              <PlusCircle size={16} />
              Add Task
            </Button>
          ) : undefined
        )}
      />

      <SectionCard variant="dense">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
          <SearchField
            label="Search tasks"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search task title, assignee, or project..."
            className="w-full sm:w-64"
          />

          <AppSelect
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="min-w-36 flex-1 sm:flex-none"
          >
            <option value="ALL">All Statuses</option>
            {TASK_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {toLabel(status)}
              </option>
            ))}
          </AppSelect>

          <AppSelect
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}
            className="min-w-36 flex-1 sm:flex-none"
          >
            <option value="ALL">All Priorities</option>
            {TASK_PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {toLabel(priority)}
              </option>
            ))}
          </AppSelect>

          <AppSelect
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            disabled={isSelfOnlyTaskView}
            className="min-w-40 flex-1 sm:flex-none"
          >
            {isSelfOnlyTaskView && <option value="ALL">My Assigned Tasks</option>}
            {!isSelfOnlyTaskView && <option value="ALL">All Assignees</option>}
            {!isSelfOnlyTaskView && assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.label}
              </option>
            ))}
          </AppSelect>

          <AppSelect
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="min-w-40 flex-1 sm:flex-none"
          >
            <option value="ALL">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </AppSelect>

          <AppSelect
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            className="min-w-36 flex-1 sm:flex-none"
          >
            <option value="ALL">All Teams</option>
            {teamOptions.map((team) => (
              <option key={team.id} value={team.id}>
                {team.label}
              </option>
            ))}
          </AppSelect>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto" aria-label="Task view">
            <Button variant="outline" size="sm" to={tenantRoutes.taskBoard()}>
              <LayoutGrid size={16} />
              Board View
            </Button>
            <Button type="button" variant="primary" size="sm" aria-current="page">
              <Table2 size={16} />
              Table View
            </Button>
          </div>
        </div>
      </SectionCard>

      {feedback && (
        <InlineAlert tone={feedback.tone} message={feedback.message} />
      )}

      {error && <ErrorBanner message={error} onRetry={fetchData} />}
      <SectionCard variant="table" title="Task Backlog" subtitle="Track delivery ownership, status, and deadlines.">
        <div className="overflow-x-auto">
          <div
            className="hidden min-w-[1080px] md:grid grid-cols-[2fr_1fr_1fr_1.2fr_1.2fr_1fr_1.5fr] gap-3 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
          >
            <span>Task</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Assignee</span>
            <span>Project</span>
            <span>Due</span>
            <span className="text-right">Actions</span>
          </div>

          {loading && Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} cols={7} />)}

          {!loading && !error && filtered.length === 0 && (
            <EmptyState
              title={search || statusFilter !== "ALL" || priorityFilter !== "ALL" || assigneeFilter !== "ALL" || projectFilter !== "ALL" || teamFilter !== "ALL" ? "No matching tasks" : "No tasks yet"}
              description={
                search || statusFilter !== "ALL" || priorityFilter !== "ALL" || assigneeFilter !== "ALL" || projectFilter !== "ALL" || teamFilter !== "ALL"
                  ? "Adjust filters to find tasks."
                  : isSelfOnlyTaskView
                    ? "No tasks are currently assigned to you."
                    : "Create your first task to start tracking workflow."
              }
              action={canCreateScopedTask ? <Button variant="outline" to={tenantRoutes.taskCreate()}>Create Task</Button> : undefined}
            />
          )}

          {!loading && filtered.length > 0 && (
            <>
              <div className="hidden min-w-[1080px] md:block">
                {taskPagination.paginatedItems.map((task) => {
                  const isDone = task.status === "DONE";
                  const canUpdateStatus = canUpdateTaskStatus(task);
                  const teamRoles = task.assignedTeamId
                    ? resolveViewerTeamRoles(employeeTeams, viewerIdentity, [task.assignedTeamId])
                    : [];
                  const statusOptions = getTaskAllowedStatuses(
                    task,
                    hasGlobalTaskManagement ? "TENANT_ADMIN" : role,
                    teamRoles,
                    isTaskAssignedToViewer(task, viewerIdentity)
                  );
                  const canUseStatusControl = canUpdateStatus && (!isDone || statusOptions.includes("IN_REVIEW"));

                  return (
                    <div
                      key={task.id}
                      className="grid grid-cols-[2fr_1fr_1fr_1.2fr_1.2fr_1fr_1.5fr] items-center gap-3 border-b px-5 py-4"
                      style={{ borderColor: "var(--border-default)" }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {task.title}
                        </p>
                        <p className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {task.description || "No description"}
                        </p>
                        <p className="truncate text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                          {task.assignedTeamName ? `Team: ${task.assignedTeamName}` : "Team: Unscoped"} | {task.assigneeName ? `Owner: ${task.assigneeName}` : "No owner"}
                        </p>
                      </div>
                      <TaskStatusBadge status={task.status} />
                      <TaskPriorityBadge priority={task.priority} />
                      <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>
                        {task.assigneeName || "Unassigned"}
                      </span>
                      <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>
                        {task.projectName || "No project"}
                      </span>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {formatDate(task.dueDate)}
                      </span>
                      <div className="flex items-center justify-end gap-2">
                        <AppSelect
                          value={task.status}
                          disabled={!canUseStatusControl}
                          onChange={(event) => handleStatusChange(task.id, event.target.value as TaskStatus)}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {toLabel(status)}
                            </option>
                          ))}
                        </AppSelect>
                        <Link
                          to={tenantRoutes.taskDetail(task.id)}
                          title="View task"
                          aria-label="View task"
                          className="inline-flex items-center justify-center p-1 transition-opacity hover:opacity-80"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <FiEye size={15} />
                        </Link>
                        {canManageTaskRecord(task) && !isDone && (
                          <>
                            <Link
                              to={tenantRoutes.taskEdit(task.id)}
                              title="Edit task"
                              aria-label="Edit task"
                              className="inline-flex items-center justify-center p-1 transition-opacity hover:opacity-80"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              <FiEdit2 size={15} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(task)}
                              title="Delete task"
                              aria-label="Delete task"
                              className="inline-flex items-center justify-center p-1 transition-opacity hover:opacity-80"
                              style={{ color: "#ef4444" }}
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </>
                        )}
                        {canManageTaskRecord(task) && isDone && (
                          <ReadOnlyIndicator message="This task is completed and is read-only." />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {taskPagination.paginatedItems.map((task) => {
                  const isDone = task.status === "DONE";
                  return (
                  <article
                    key={task.id}
                    className="rounded-xl border p-4"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {task.description || "No description"}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <TaskStatusBadge status={task.status} />
                      <TaskPriorityBadge priority={task.priority} />
                    </div>

                    <div className="mt-3 space-y-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      <p>Assignee: {task.assigneeName || "Unassigned"}</p>
                      <p>Team: {task.assignedTeamName || "Unscoped"}</p>
                      <p>Owner: {task.assigneeName || "Unassigned"}</p>
                      <p>Project: {task.projectName || "No project"}</p>
                      <p>Due: {formatDate(task.dueDate)}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" to={tenantRoutes.taskDetail(task.id)}>View</Button>
                      {canManageTaskRecord(task) && !isDone && (
                        <>
                          <Button variant="outline" size="sm" to={tenantRoutes.taskEdit(task.id)}>Edit</Button>
                          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(task)}>
                            <Trash2 size={14} color="#ef4444" />
                            Delete
                          </Button>
                        </>
                      )}
                      {canManageTaskRecord(task) && isDone && (
                        <ReadOnlyIndicator message="This task is completed and is read-only." />
                      )}
                    </div>
                  </article>
                  );
                })}
              </div>
            </>
        )}
        </div>
        {!loading && !error && filtered.length > 0 && (
          <Pagination
            currentPage={taskPagination.currentPage}
            totalItems={filtered.length}
            pageSize={taskPagination.pageSize}
            onPageChange={taskPagination.setCurrentPage}
            onPageSizeChange={taskPagination.setPageSize}
            itemLabel="tasks"
          />
        )}
      </SectionCard>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete task?"
        description={`This will permanently remove "${deleteTarget?.title ?? "this task"}".`}
        confirmLabel="Delete Task"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Not set";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
