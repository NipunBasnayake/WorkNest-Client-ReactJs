import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Calendar, ClipboardList, Layers3 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import {
  assignTeamToProject,
  getProjectById,
  removeTeamFromProject,
} from "@/modules/projects/services/projectService";
import { getMyEmployeeProfile } from "@/modules/employees/services/employeeService";
import { getTeams } from "@/modules/teams/services/teamService";
import { getTasks } from "@/modules/tasks/services/taskService";
import { resolveViewerTeamRoles } from "@/modules/teams/utils/teamRoles";
import { FileAssetList } from "@/components/common/FileAssetList";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import type { Project } from "@/modules/projects/types";
import type { Team } from "@/modules/teams/types";
import type { Task } from "@/modules/tasks/types";
import { getErrorMessage } from "@/utils/errorHandler";

interface ViewerContext {
  employeeId?: string;
  email?: string;
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role, user } = useAuth();
  const { hasPermission } = usePermission();
  usePageMeta({ title: "Project Details", breadcrumb: ["Workspace", "Projects", "Details"] });

  const canManageProjects = hasPermission(PERMISSIONS.PROJECTS_MANAGE);
  const isEmployeeOnly = role === "EMPLOYEE" && !canManageProjects;

  const [project, setProject] = useState<Project | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewer, setViewer] = useState<ViewerContext>({});
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [teamToAssign, setTeamToAssign] = useState("");
  const [assigningTeam, setAssigningTeam] = useState(false);
  const [removeTeamTarget, setRemoveTeamTarget] = useState<Team | null>(null);
  const [removingTeam, setRemovingTeam] = useState(false);

  const resolvedError = !id ? "Invalid project id." : error;

  async function loadProjectContext(projectId: string) {
    const profilePromise = isEmployeeOnly
      ? getMyEmployeeProfile().catch(() => null)
      : Promise.resolve(null);

    const [projectRes, teamRes, taskRes, profile] = await Promise.all([
      getProjectById(projectId),
      getTeams().catch(() => []),
      getTasks().catch(() => []),
      profilePromise,
    ]);

    setProject(projectRes);
    setTeams(teamRes);
    setTasks(taskRes);
    setViewer({
      employeeId: profile?.id ?? user?.id,
      email: profile?.email ?? user?.email,
    });
  }

  useEffect(() => {
    if (!id) return;
    let active = true;

    setLoading(true);
    setError(null);

    loadProjectContext(id)
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err, "Unable to load project details."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isEmployeeOnly, user?.email, user?.id]);

  const visibleTeamIdsForEmployee = useMemo(() => {
    if (!isEmployeeOnly) return new Set<string>();
    const visibleTeams = teams.filter((team) => isTeamVisibleToEmployee(team, viewer));
    return new Set(visibleTeams.map((team) => team.id));
  }, [isEmployeeOnly, teams, viewer]);

  const projectTasks = useMemo(() => {
    if (!project) return [];
    return tasks.filter((task) => task.projectId === project.id);
  }, [project, tasks]);

  const viewerHasTaskInProject = useMemo(() => {
    if (!project || !viewer.employeeId) return false;
    return projectTasks.some((task) => task.assigneeId === viewer.employeeId);
  }, [project, projectTasks, viewer.employeeId]);

  const employeeCanViewProject = useMemo(() => {
    if (!project || !isEmployeeOnly) return true;
    const linkedByTeam = project.teamIds.some((teamId) => visibleTeamIdsForEmployee.has(teamId));
    return linkedByTeam || viewerHasTaskInProject;
  }, [isEmployeeOnly, project, viewerHasTaskInProject, visibleTeamIdsForEmployee]);

  const assignedTeams = useMemo(() => {
    if (!project) return [];
    const map = new Map(teams.map((team) => [team.id, team]));
    return project.teamIds.map((teamId) => map.get(teamId)).filter((item): item is Team => Boolean(item));
  }, [project, teams]);

  const viewerTeamRoles = useMemo(
    () => resolveViewerTeamRoles(teams, viewer, project?.teamIds),
    [project?.teamIds, teams, viewer]
  );

  const canEditProject = hasPermission(PERMISSIONS.PROJECTS_EDIT, { teamRoles: viewerTeamRoles });
  const canAssignProjectTasks = hasPermission(PERMISSIONS.TASKS_ASSIGN, { teamRoles: viewerTeamRoles });

  const unlinkedTeamIds = useMemo(() => {
    if (!project) return [];
    const known = new Set(teams.map((team) => team.id));
    return project.teamIds.filter((teamId) => !known.has(teamId));
  }, [project, teams]);

  const availableTeamsToAssign = useMemo(() => {
    if (!project) return [];
    const assigned = new Set(project.teamIds);
    return teams.filter((team) => !assigned.has(team.id));
  }, [project, teams]);

  const computedProgress = useMemo(() => {
    if (!project) return 0;
    if (projectTasks.length === 0) return project.progress;
    const done = projectTasks.filter((task) => task.status === "DONE").length;
    return Math.round((done / projectTasks.length) * 100);
  }, [project, projectTasks]);

  const taskSummary = useMemo(() => {
    const summary = {
      total: projectTasks.length,
      done: 0,
      inProgress: 0,
      review: 0,
      blocked: 0,
      todo: 0,
    };

    for (const task of projectTasks) {
      if (task.status === "DONE") summary.done += 1;
      else if (task.status === "IN_PROGRESS") summary.inProgress += 1;
      else if (task.status === "IN_REVIEW") summary.review += 1;
      else if (task.status === "BLOCKED") summary.blocked += 1;
      else summary.todo += 1;
    }

    return summary;
  }, [projectTasks]);

  async function refreshProject() {
    if (!id) return;
    const nextProject = await getProjectById(id);
    setProject(nextProject);
  }

  async function handleAssignTeam() {
    if (!id || !teamToAssign) return;
    setAssigningTeam(true);
    setMessage(null);
    try {
      await assignTeamToProject(id, teamToAssign);
      await refreshProject();
      setTeamToAssign("");
      setMessage("Team assigned to project.");
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Unable to assign team."));
    } finally {
      setAssigningTeam(false);
    }
  }

  async function handleRemoveTeam() {
    if (!id || !removeTeamTarget) return;
    setRemovingTeam(true);
    setMessage(null);
    try {
      await removeTeamFromProject(id, removeTeamTarget.id);
      await refreshProject();
      setMessage("Team removed from project.");
      setRemoveTeamTarget(null);
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Unable to remove team."));
    } finally {
      setRemovingTeam(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" to="/app/projects">
          <ArrowLeft size={16} />
          Back
        </Button>
        {project && canEditProject && <Button variant="outline" to={`/app/projects/${project.id}/edit`}>Edit Project</Button>}
      </div>

      {message && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: message.toLowerCase().includes("unable") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
            backgroundColor: message.toLowerCase().includes("unable") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
            color: message.toLowerCase().includes("unable") ? "#ef4444" : "#10b981",
          }}
        >
          {message}
        </div>
      )}

      {loading && (
        <div className="py-24 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-transparent animate-spin"
            style={{ borderTopColor: "#9332EA", borderLeftColor: "rgba(147,50,234,0.3)" }}
          />
        </div>
      )}

      {!loading && resolvedError && <ErrorBanner message={resolvedError} />}

      {!loading && !resolvedError && !project && (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title="Project not found"
          description="The requested project does not exist."
          action={<Button variant="outline" to="/app/projects">Go to Projects</Button>}
        />
      )}

      {!loading && !resolvedError && project && !employeeCanViewProject && (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title="Access restricted"
          description="You can only view projects linked to your team or assigned work."
          action={<Button variant="outline" to="/app/projects">Go to Projects</Button>}
        />
      )}

      {!loading && !resolvedError && project && employeeCanViewProject && (
        <>
          <SectionCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {project.name}
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {project.description || "No project description provided."}
                </p>
              </div>
              <StatusBadge status={project.status} />
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <SectionCard title="Progress">
              <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                {computedProgress}%
              </div>
              <div className="mt-2 h-2 rounded-full" style={{ backgroundColor: "var(--bg-muted)" }}>
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, computedProgress))}%`, background: "linear-gradient(90deg, #9332EA 0%, #7c1fd1 100%)" }}
                />
              </div>
            </SectionCard>

            <SectionCard title="Timeline">
              <div className="space-y-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                <div className="inline-flex items-center gap-1.5">
                  <Calendar size={14} />
                  Start: {formatDate(project.startDate)}
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <Calendar size={14} />
                  End: {formatDate(project.endDate)}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Teams">
              <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                {project.teamIds.length}
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Teams linked to this project
              </p>
            </SectionCard>

            <SectionCard title="Tasks">
              <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                {taskSummary.total}
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                {taskSummary.total === 0 ? "No tasks yet" : `${taskSummary.total - taskSummary.done} open`}
              </p>
            </SectionCard>
          </div>

          <SectionCard
            title="Task Progress"
            subtitle="Execution breakdown linked to this project."
            action={(
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" to="/app/tasks">
                  Open Tasks
                </Button>
                {(hasPermission(PERMISSIONS.TASKS_MANAGE) || canAssignProjectTasks) && (
                  <Button size="sm" variant="primary" to={`/app/tasks/new?projectId=${project.id}`}>
                    Create Task
                  </Button>
                )}
              </div>
            )}
          >
            {projectTasks.length === 0 && (
              <EmptyState
                icon={<ClipboardList size={22} />}
                title="No tasks linked"
                description="Create and assign tasks to start tracking project execution."
              />
            )}

            {projectTasks.length > 0 && (
              <div className="space-y-3">
                <div
                  className="grid grid-cols-2 gap-2 rounded-xl border p-3 text-xs sm:grid-cols-5"
                  style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                >
                  <span>Total: {taskSummary.total}</span>
                  <span>Open: {taskSummary.total - taskSummary.done}</span>
                  <span>In Progress: {taskSummary.inProgress}</span>
                  <span>Review: {taskSummary.review}</span>
                  <span>Done: {taskSummary.done}</span>
                </div>

                {projectTasks.slice(0, 8).map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2" style={{ borderColor: "var(--border-default)" }}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {task.title}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {toReadableLabel(task.status)} - {toReadableLabel(task.priority)}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" to={`/app/tasks/${task.id}`}>
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <div id="project-teams">
            <SectionCard title="Assigned Teams" subtitle="Teams currently linked to this project.">
            {canManageProjects && (
              <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                <AppSelect
                  value={teamToAssign}
                  onChange={(event) => setTeamToAssign(event.target.value)}
                  disabled={availableTeamsToAssign.length === 0}
                >
                  <option value="">
                    {availableTeamsToAssign.length === 0 ? "All teams are already assigned" : "Select team to assign"}
                  </option>
                  {availableTeamsToAssign.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </AppSelect>
                <Button variant="primary" onClick={handleAssignTeam} disabled={!teamToAssign || assigningTeam}>
                  {assigningTeam ? "Assigning..." : "Assign Team"}
                </Button>
              </div>
            )}

            {assignedTeams.length === 0 && unlinkedTeamIds.length === 0 && (
              <EmptyState
                icon={<Layers3 size={24} />}
                title="No teams assigned"
                description={canManageProjects ? "Assign one or more teams to start delivery." : "No teams are linked to this project."}
              />
            )}

            {(assignedTeams.length > 0 || unlinkedTeamIds.length > 0) && (
              <div className="space-y-2">
                {assignedTeams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2" style={{ borderColor: "var(--border-default)" }}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {team.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        Manager: {team.managerName || "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" to={`/app/teams/${team.id}`}>
                        View Team
                      </Button>
                      {canManageProjects && (
                        <Button size="sm" variant="danger" onClick={() => setRemoveTeamTarget(team)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {unlinkedTeamIds.map((teamId) => (
                  <div
                    key={teamId}
                    className="rounded-xl border px-3 py-2 text-xs"
                    style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
                  >
                    Linked team reference: {teamId}
                  </div>
                ))}
              </div>
            )}
            </SectionCard>
          </div>

          <SectionCard title="Project Documents" subtitle="Shared files linked to this project.">
            <FileAssetList
              items={project.documents}
              emptyLabel="No project documents uploaded yet."
            />
          </SectionCard>
        </>
      )}

      <ConfirmDialog
        open={Boolean(removeTeamTarget)}
        title="Remove assigned team?"
        description={removeTeamTarget ? `Remove ${removeTeamTarget.name} from this project.` : ""}
        confirmLabel="Remove Team"
        loading={removingTeam}
        onCancel={() => setRemoveTeamTarget(null)}
        onConfirm={handleRemoveTeam}
      />
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

function toReadableLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}
