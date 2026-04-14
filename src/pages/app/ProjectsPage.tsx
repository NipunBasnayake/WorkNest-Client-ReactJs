import { useMemo, useState } from "react";
import { Calendar, FolderKanban, Search } from "lucide-react";
import { FiEdit2, FiEye } from "react-icons/fi";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { useMyProjectsQuery, useProjectsQuery, useTasksQuery } from "@/hooks/queries/useCoreQueries";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState, ErrorState } from "@/components/common/AsyncStates";
import { SkeletonRow } from "@/components/common/AppUI";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import type { Project, ProjectStatus } from "@/modules/projects/types";
import type { Task } from "@/modules/tasks/types";
import { getErrorMessage } from "@/utils/errorHandler";
import { formatDate } from "@/utils/formatting";

type ProjectStatusFilter = "all" | ProjectStatus;

interface ProjectTaskSummary {
  total: number;
  done: number;
  open: number;
  progress: number;
}

const EMPTY_PROJECTS: Project[] = [];
const EMPTY_TASKS: Task[] = [];

export function ProjectsPage() {
  usePageMeta({ title: "Projects", breadcrumb: ["Workspace", "Projects"] });
  const { role } = useAuth();
  const { hasPermission } = usePermission();

  const canManageProjects = hasPermission(PERMISSIONS.PROJECTS_MANAGE);
  const isEmployeeOnly = role === "EMPLOYEE" && !canManageProjects;
  const isReadOnly = !canManageProjects;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("all");

  const projectsQuery = isEmployeeOnly ? useMyProjectsQuery(true) : useProjectsQuery(true);
  const tasksQuery = useTasksQuery(true);

  const projects = projectsQuery.data ?? EMPTY_PROJECTS;
  const tasks = tasksQuery.data ?? EMPTY_TASKS;

  const loading = projectsQuery.isLoading || tasksQuery.isLoading;

  const firstError = projectsQuery.error ?? tasksQuery.error;
  const errorMessage = firstError ? getErrorMessage(firstError, "Failed to load projects.") : null;

  function retryFetch(): void {
    void projectsQuery.refetch();
    void tasksQuery.refetch();
  }

  const visibleProjects = projects;

  const projectTaskSummary = useMemo(() => {
    const map = new Map<string, ProjectTaskSummary>();

    for (const project of projects) {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      const done = projectTasks.filter((task) => task.status === "DONE").length;
      const total = projectTasks.length;
      const open = total - done;
      const progress = total > 0 ? Math.round((done / total) * 100) : project.progress;
      map.set(project.id, { total, done, open, progress });
    }

    return map;
  }, [projects, tasks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleProjects.filter((project) => {
      const matchesSearch = !q || [
        project.name,
        project.description,
        project.status,
        project.teamIds.join(" "),
      ].some((value) => value?.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, visibleProjects]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isReadOnly ? "Projects" : "Project Management"}
        description={
          loading
            ? "Loading projects..."
            : `${visibleProjects.length} project${visibleProjects.length === 1 ? "" : "s"} visible.`
        }
        actions={canManageProjects ? (
          <Button variant="primary" to="/app/projects/new">
            <FolderKanban size={16} />
            Add Project
          </Button>
        ) : undefined}
      />

      <SectionCard>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project name, status, description, or team..."
              className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
            />
          </div>

          <AppSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatusFilter)}
          >
            <option value="all">All Statuses</option>
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </AppSelect>
        </div>
      </SectionCard>

      {errorMessage && <ErrorState message={errorMessage} onRetry={retryFetch} />}

      <SectionCard className="overflow-hidden" contentClassName="p-0" title="Projects" subtitle="Track scope, timeline, teams, and execution health.">
        <div className="overflow-x-auto">
          <div
            className="hidden min-w-[1020px] md:grid grid-cols-[1.9fr_0.9fr_0.9fr_0.8fr_1fr_1.2fr_1.4fr] gap-3 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
          >
            <span>Project</span>
            <span>Status</span>
            <span>Progress</span>
            <span>Teams</span>
            <span>Tasks</span>
            <span>Timeline</span>
            <span className="text-right">Actions</span>
          </div>

          {loading && Array.from({ length: 5 }).map((_, idx) => <SkeletonRow key={idx} cols={7} />)}

        {!loading && !errorMessage && filtered.length === 0 && (
          <EmptyState
            icon={<FolderKanban size={28} />}
            title={search || statusFilter !== "all" ? "No matching projects" : (isEmployeeOnly ? "No relevant projects" : "No projects yet")}
            description={
              search || statusFilter !== "all"
                ? "Try a different search term or status."
                : isEmployeeOnly
                  ? "No projects are linked to your team or assigned work yet."
                  : "Create your first project to start tracking delivery."
            }
            action={canManageProjects ? <Button variant="outline" to="/app/projects/new">Create Project</Button> : undefined}
          />
        )}

        {!loading && !errorMessage && filtered.length > 0 && (
          <>
            <div className="hidden min-w-[1020px] md:block">
              {filtered.map((project) => {
                const summary = projectTaskSummary.get(project.id);
                const progress = summary?.progress ?? project.progress;
                const taskLabel = summary ? `${summary.open}/${summary.total} open` : "No task data";
                return (
                  <div
                    key={project.id}
                    className="grid grid-cols-[1.9fr_0.9fr_0.9fr_0.8fr_1fr_1.2fr_1.4fr] items-center gap-3 border-b px-5 py-4"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{project.name}</div>
                      <div className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>{project.description || "No description"}</div>
                    </div>
                    <StatusBadge status={project.status} />
                    <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{progress}%</span>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{getProjectTeamCount(project)}</span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{taskLabel}</span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {formatDate(project.startDate)} {project.endDate ? `to ${formatDate(project.endDate)}` : ""}
                    </span>
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/app/projects/${project.id}`}
                        title="View project"
                        aria-label="View project"
                        className="inline-flex items-center justify-center p-1 transition-opacity hover:opacity-80"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <FiEye size={15} />
                      </Link>
                      {canManageProjects && (
                        <Link
                          to={`/app/projects/${project.id}/edit`}
                          title="Edit project"
                          aria-label="Edit project"
                          className="inline-flex items-center justify-center p-1 transition-opacity hover:opacity-80"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <FiEdit2 size={15} />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {filtered.map((project) => {
                const summary = projectTaskSummary.get(project.id);
                const progress = summary?.progress ?? project.progress;

                return (
                  <article
                    key={project.id}
                    className="rounded-xl border p-4"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{project.name}</div>
                        <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{progress}% complete</div>
                        <div className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>Teams: {getProjectTeamCount(project)}</div>
                        <div className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                          Tasks: {summary ? `${summary.open}/${summary.total} open` : "No task data"}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                          <Calendar size={12} />
                          {formatDate(project.startDate)} {project.endDate ? `to ${formatDate(project.endDate)}` : ""}
                        </div>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" to={`/app/projects/${project.id}`}>View</Button>
                      {canManageProjects && <Button variant="outline" size="sm" to={`/app/projects/${project.id}/edit`}>Edit</Button>}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
        </div>
      </SectionCard>
    </div>
  );
}

function getProjectTeamCount(project: Project): number {
  return project.teamCount ?? project.teamIds.length;
}
