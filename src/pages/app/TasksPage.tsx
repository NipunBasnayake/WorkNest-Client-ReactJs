import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, PlusCircle, Search, Trash2 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteTask,
  filterTasksForViewer,
  getTasks,
  hasTaskViewerIdentity,
  isTaskAssignedToViewer,
  resolveTaskViewerIdentity,
  updateTaskStatus,
  type TaskViewerIdentity,
} from "@/modules/tasks/services/taskService";
import { TaskPriorityBadge } from "@/modules/tasks/components/TaskPriorityBadge";
import { TaskStatusBadge } from "@/modules/tasks/components/TaskStatusBadge";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, type Task, type TaskStatus } from "@/modules/tasks/types";
import { getEmployees } from "@/modules/employees/services/employeeService";
import { getEmployeeDisplayName } from "@/modules/employees/utils/employeeMapper";
import { getProjects } from "@/modules/projects/services/projectService";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";

interface Option {
  id: string;
  label: string;
}

type EmployeeStatusFlow = Extract<TaskStatus, "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE">;
const EMPLOYEE_STATUS_OPTIONS: EmployeeStatusFlow[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

function toLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function TasksPage() {
  usePageMeta({ title: "Tasks", breadcrumb: ["Workspace", "Tasks"] });
  const { hasRole, user } = useAuth();

  const canManageTasks = hasRole("TENANT_ADMIN", "ADMIN", "MANAGER");
  const isEmployeeOnly = hasRole("EMPLOYEE") && !canManageTasks;

  const [viewerIdentity, setViewerIdentity] = useState<TaskViewerIdentity | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | typeof TASK_PRIORITY_OPTIONS[number]>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const employeePromise = canManageTasks ? getEmployees().catch(() => []) : Promise.resolve([]);
      const identityPromise = isEmployeeOnly ? resolveTaskViewerIdentity() : Promise.resolve(null);
      const [taskRes, employeeRes, projectRes, identity] = await Promise.all([
        getTasks(),
        employeePromise,
        getProjects().catch(() => []),
        identityPromise,
      ]);

      setTasks(taskRes);
      setAssignees(employeeRes.map((employee) => ({ id: employee.id, label: getEmployeeDisplayName(employee) })));
      setProjects(projectRes.map((project) => ({ id: project.id, label: project.name })));
      setViewerIdentity(identity);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) ?? "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, [canManageTasks, isEmployeeOnly, user?.id]);

  const scopedTasks = useMemo(() => {
    if (!isEmployeeOnly) return tasks;
    return filterTasksForViewer(tasks, viewerIdentity);
  }, [isEmployeeOnly, tasks, viewerIdentity]);

  const identityResolved = !isEmployeeOnly || hasTaskViewerIdentity(viewerIdentity);

  const filtered = useMemo(() => {
    const effectiveAssigneeFilter = isEmployeeOnly ? "ALL" : assigneeFilter;
    const query = search.trim().toLowerCase();

    return scopedTasks.filter((task) => {
      const matchesQuery =
        !query ||
        [task.title, task.description || "", task.assigneeName || "", task.projectName || ""]
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;
      const matchesAssignee =
        effectiveAssigneeFilter === "ALL" ||
        task.assigneeId === effectiveAssigneeFilter ||
        task.assigneeEmployeeId === effectiveAssigneeFilter ||
        task.assigneeUserId === effectiveAssigneeFilter;
      const matchesProject = projectFilter === "ALL" || task.projectId === projectFilter;
      return matchesQuery && matchesStatus && matchesPriority && matchesAssignee && matchesProject;
    });
  }, [
    assigneeFilter,
    isEmployeeOnly,
    priorityFilter,
    projectFilter,
    scopedTasks,
    search,
    statusFilter,
  ]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setFeedback(null);
    try {
      await deleteTask(deleteTarget.id);
      setTasks((prev) => prev.filter((task) => task.id !== deleteTarget.id));
      setDeleteTarget(null);
      setFeedback("Task deleted successfully.");
    } catch (err: unknown) {
      setFeedback(extractErrorMessage(err) ?? "Could not delete task right now.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const target = tasks.find((task) => task.id === taskId);
    if (!target) return;

    const canUpdate = canManageTasks || (isEmployeeOnly && isTaskAssignedToViewer(target, viewerIdentity));
    if (!canUpdate) return;

    try {
      const updated = await updateTaskStatus(taskId, status);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
      setFeedback(`Task moved to ${toLabel(status)}.`);
    } catch (err: unknown) {
      setFeedback(extractErrorMessage(err) ?? "Unable to update task status.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployeeOnly ? "My Tasks" : "Task Management"}
        description={loading ? "Loading tasks..." : `${filtered.length} task${filtered.length === 1 ? "" : "s"} in workflow.`}
        actions={(
          <>
            <Button variant="outline" to="/app/tasks/board">
              <LayoutGrid size={16} />
              Board View
            </Button>
            {canManageTasks && (
              <Button variant="primary" to="/app/tasks/new">
                <PlusCircle size={16} />
                Add Task
              </Button>
            )}
          </>
        )}
      />

      <SectionCard>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr_1fr_1fr]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search task title, assignee, or project..."
              className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          >
            <option value="ALL">All Statuses</option>
            {TASK_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {toLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}
            className="rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          >
            <option value="ALL">All Priorities</option>
            {TASK_PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {toLabel(priority)}
              </option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            disabled={isEmployeeOnly}
            className="rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          >
            {isEmployeeOnly && <option value="ALL">My Assigned Tasks</option>}
            {!isEmployeeOnly && <option value="ALL">All Assignees</option>}
            {!isEmployeeOnly && assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.label}
              </option>
            ))}
          </select>

          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          >
            <option value="ALL">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      {feedback && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: feedback.toLowerCase().includes("unable") || feedback.toLowerCase().includes("could") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
            backgroundColor: feedback.toLowerCase().includes("unable") || feedback.toLowerCase().includes("could") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
            color: feedback.toLowerCase().includes("unable") || feedback.toLowerCase().includes("could") ? "#ef4444" : "#10b981",
          }}
        >
          {feedback}
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={fetchData} />}
      {!error && isEmployeeOnly && !identityResolved && (
        <ErrorBanner
          message="Unable to resolve your employee identity for task scoping. Please refresh or contact your workspace admin."
          onRetry={fetchData}
        />
      )}

      <SectionCard className="overflow-hidden" contentClassName="p-0" title="Task Backlog" subtitle="Track delivery ownership, status, and deadlines.">
        <div
          className="hidden md:grid grid-cols-[2fr_1fr_1fr_1.2fr_1.2fr_1fr_1.5fr] gap-3 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider"
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
            title={search || statusFilter !== "ALL" || priorityFilter !== "ALL" || assigneeFilter !== "ALL" || projectFilter !== "ALL" ? "No matching tasks" : "No tasks yet"}
            description={
              search || statusFilter !== "ALL" || priorityFilter !== "ALL" || assigneeFilter !== "ALL" || projectFilter !== "ALL"
                ? "Adjust filters to find tasks."
                : isEmployeeOnly
                  ? "No tasks are currently assigned to you."
                  : "Create your first task to start tracking workflow."
            }
            action={canManageTasks ? <Button variant="outline" to="/app/tasks/new">Create Task</Button> : undefined}
          />
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="hidden md:block">
              {filtered.map((task) => {
                const canUpdateStatus = canManageTasks || (isEmployeeOnly && isTaskAssignedToViewer(task, viewerIdentity));
                const statusOptions = resolveStatusOptions(canManageTasks, task.status);

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
                    <div className="flex items-center justify-end gap-1.5">
                      <select
                        value={task.status}
                        disabled={!canUpdateStatus}
                        onChange={(event) => handleStatusChange(task.id, event.target.value as TaskStatus)}
                        className="rounded-lg border px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60"
                        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {toLabel(status)}
                          </option>
                        ))}
                      </select>
                      <Button variant="ghost" size="sm" to={`/app/tasks/${task.id}`}>View</Button>
                      {canManageTasks && (
                        <>
                          <Button variant="outline" size="sm" to={`/app/tasks/${task.id}/edit`}>Edit</Button>
                          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(task)}>
                            <Trash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {filtered.map((task) => (
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
                    <p>Project: {task.projectName || "No project"}</p>
                    <p>Due: {formatDate(task.dueDate)}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" to={`/app/tasks/${task.id}`}>View</Button>
                    {canManageTasks && (
                      <>
                        <Button variant="outline" size="sm" to={`/app/tasks/${task.id}/edit`}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(task)}>
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
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

function resolveStatusOptions(canManageTasks: boolean, currentStatus: TaskStatus): TaskStatus[] {
  if (canManageTasks) return TASK_STATUS_OPTIONS;
  const options = new Set<TaskStatus>([...EMPLOYEE_STATUS_OPTIONS, currentStatus]);
  return Array.from(options);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Not set";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function extractErrorMessage(err: unknown): string | null {
  if (typeof err === "object" && err !== null) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    return error.response?.data?.message ?? error.message ?? null;
  }
  return null;
}
