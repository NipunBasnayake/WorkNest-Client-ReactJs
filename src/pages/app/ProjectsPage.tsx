import { useEffect, useMemo, useState } from "react";
import { Calendar, FolderKanban, Search } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { getProjects } from "@/modules/projects/services/projectService";
import { getTeams } from "@/modules/teams/services/teamService";
import { getTasks } from "@/modules/tasks/services/taskService";
import { getMyEmployeeProfile } from "@/modules/employees/services/employeeService";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import type { Project, ProjectStatus } from "@/modules/projects/types";
import type { Team } from "@/modules/teams/types";
import type { Task } from "@/modules/tasks/types";

type ProjectStatusFilter = "all" | ProjectStatus;

interface ViewerContext {
  employeeId?: string;
  email?: string;
}

interface ProjectTaskSummary {
  total: number;
  done: number;
  open: number;
  progress: number;
}

export function ProjectsPage() {
  usePageMeta({ title: "Projects", breadcrumb: ["Workspace", "Projects"] });
  const { hasRole, user } = useAuth();

  const canManageProjects = hasRole("TENANT_ADMIN", "ADMIN", "MANAGER");
  const isEmployeeOnly = hasRole("EMPLOYEE") && !canManageProjects;
  const isReadOnly = !canManageProjects;

  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewer, setViewer] = useState<ViewerContext>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("all");

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const profilePromise = isEmployeeOnly
        ? getMyEmployeeProfile().catch(() => null)
        : Promise.resolve(null);

      const [projectRes, teamRes, taskRes, profile] = await Promise.all([
        getProjects(),
        getTeams().catch(() => []),
        getTasks().catch(() => []),
        profilePromise,
      ]);

      setProjects(projectRes);
      setTeams(teamRes);
      setTasks(taskRes);
      setViewer({
        employeeId: profile?.id ?? user?.id,
        email: profile?.email ?? user?.email,
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err) ?? "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, [isEmployeeOnly, user?.email, user?.id]);

  const teamNameMap = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((team) => map.set(team.id, team.name));
    return map;
  }, [teams]);

  const visibleTeamIdsForEmployee = useMemo(() => {
    if (!isEmployeeOnly) return new Set<string>();
    const visibleTeams = teams.filter((team) => isTeamVisibleToEmployee(team, viewer));
    return new Set(visibleTeams.map((team) => team.id));
  }, [isEmployeeOnly, teams, viewer]);

  const myTaskProjectIds = useMemo(() => {
    if (!isEmployeeOnly || !viewer.employeeId) return new Set<string>();
    const ids = tasks
      .filter((task) => task.assigneeId === viewer.employeeId && task.projectId)
      .map((task) => task.projectId as string);
    return new Set(ids);
  }, [isEmployeeOnly, tasks, viewer.employeeId]);

  const visibleProjects = useMemo(() => {
    if (!isEmployeeOnly) return projects;
    return projects.filter((project) => {
      const teamLinked = project.teamIds.some((teamId) => visibleTeamIdsForEmployee.has(teamId));
      const taskLinked = myTaskProjectIds.has(project.id);
      return teamLinked || taskLinked;
    });
  }, [isEmployeeOnly, myTaskProjectIds, projects, visibleTeamIdsForEmployee]);

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
      const teamPreview = project.teamIds.map((teamId) => teamNameMap.get(teamId) ?? "").join(" ");
      const matchesSearch = !q || [
        project.name,
        project.description,
        project.status,
        teamPreview,
      ].some((value) => value?.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, teamNameMap, visibleProjects]);

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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatusFilter)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          >
            <option value="all">All Statuses</option>
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </SectionCard>

      {error && <ErrorBanner message={error} onRetry={fetchData} />}

      <SectionCard className="overflow-hidden" contentClassName="p-0" title="Projects" subtitle="Track scope, timeline, teams, and execution health.">
        <div
          className="hidden md:grid grid-cols-[1.9fr_0.9fr_0.9fr_0.8fr_1fr_1.2fr_1.4fr] gap-3 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider"
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

        {!loading && !error && filtered.length === 0 && (
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

        {!loading && filtered.length > 0 && (
          <>
            <div className="hidden md:block">
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
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{project.teamIds.length}</span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{taskLabel}</span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {formatDate(project.startDate)} {project.endDate ? `to ${formatDate(project.endDate)}` : ""}
                    </span>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button variant="ghost" size="sm" to={`/app/projects/${project.id}`}>View</Button>
                      {canManageProjects && <Button variant="outline" size="sm" to={`/app/projects/${project.id}/edit`}>Edit</Button>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {filtered.map((project) => {
                const summary = projectTaskSummary.get(project.id);
                const progress = summary?.progress ?? project.progress;
                const teamPreview = project.teamIds.map((teamId) => teamNameMap.get(teamId) ?? teamId).join(", ") || "None";

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
                        <div className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>Teams: {teamPreview}</div>
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
      </SectionCard>
    </div>
  );
}

function isTeamVisibleToEmployee(team: Team, viewer: ViewerContext): boolean {
  const email = viewer.email?.toLowerCase();
  return Boolean(
    (viewer.employeeId && team.memberIds.includes(viewer.employeeId)) ||
    (viewer.employeeId && team.managerEmployeeId === viewer.employeeId) ||
    (email && team.members.some((member) => member.email?.toLowerCase() === email))
  );
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function extractErrorMessage(err: unknown): string | null {
  if (typeof err === "object" && err !== null) {
    const error = err as { response?: { data?: { message?: string } }; message?: string };
    return error.response?.data?.message ?? error.message ?? null;
  }
  return null;
}
