import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Calendar, ClipboardList, Layers3 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getProjectById } from "@/modules/projects/services/projectService";
import { getTeams } from "@/modules/teams/services/teamService";
import { getTasks } from "@/modules/tasks/services/taskService";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import type { Project } from "@/modules/projects/types";
import type { Team } from "@/modules/teams/types";
import type { Task } from "@/modules/tasks/types";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  usePageMeta({ title: "Project Details", breadcrumb: ["Workspace", "Projects", "Details"] });

  const [project, setProject] = useState<Project | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const resolvedError = !id ? "Invalid project id." : error;

  useEffect(() => {
    if (!id) return;

    let active = true;

    Promise.all([getProjectById(id), getTeams(), getTasks().catch(() => [])])
      .then(([projectRes, teamRes, taskRes]) => {
        if (!active) return;
        setProject(projectRes);
        setTeams(teamRes);
        setTasks(taskRes);
      })
      .catch(() => {
        if (active) setError("Unable to load project details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const assignedTeams = useMemo(() => {
    if (!project) return [];
    const map = new Map(teams.map((team) => [team.id, team]));
    return project.teamIds.map((teamId) => map.get(teamId)).filter((item): item is Team => Boolean(item));
  }, [project, teams]);

  const projectTasks = useMemo(() => {
    if (!project) return [];
    return tasks.filter((task) => task.projectId === project.id);
  }, [project, tasks]);

  const computedProgress = useMemo(() => {
    if (!project) return 0;
    if (projectTasks.length === 0) return project.progress;
    const done = projectTasks.filter((task) => task.status === "DONE").length;
    return Math.round((done / projectTasks.length) * 100);
  }, [project, projectTasks]);

  const openTaskCount = useMemo(
    () => projectTasks.filter((task) => task.status !== "DONE").length,
    [projectTasks]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" to="/app/projects">
          <ArrowLeft size={16} />
          Back
        </Button>
        {project && <Button variant="outline" to={`/app/projects/${project.id}/edit`}>Edit Project</Button>}
      </div>

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

      {!loading && !resolvedError && project && (
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  Start: {project.startDate || "—"}
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <Calendar size={14} />
                  End: {project.endDate || "Not set"}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Assigned Teams">
              <div className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                {project.teamIds.length}
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Teams contributing to this project
              </p>
            </SectionCard>
          </div>

          <SectionCard title="Task Progress" subtitle="Live task breakdown for this project.">
            {projectTasks.length === 0 && (
              <EmptyState
                icon={<ClipboardList size={22} />}
                title="No tasks linked"
                description="Create and assign tasks to start tracking project execution."
              />
            )}

            {projectTasks.length > 0 && (
              <div className="space-y-2">
                <div className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}>
                  {projectTasks.length} total task{projectTasks.length === 1 ? "" : "s"} • {openTaskCount} open • {projectTasks.length - openTaskCount} done
                </div>

                {projectTasks.slice(0, 6).map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2" style={{ borderColor: "var(--border-default)" }}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {task.title}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {task.status.replace("_", " ")} • {task.priority}
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

          <SectionCard title="Teams" subtitle="Teams currently linked to this project.">
            {assignedTeams.length === 0 && (
              <EmptyState
                icon={<Layers3 size={24} />}
                title="No teams assigned"
                description="Edit this project to assign one or more teams."
              />
            )}
            {assignedTeams.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {assignedTeams.map((team) => (
                  <span
                    key={team.id}
                    className="rounded-full border px-3 py-1.5 text-sm font-medium"
                    style={{ color: "var(--text-primary)", borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
                  >
                    {team.name}
                  </span>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
