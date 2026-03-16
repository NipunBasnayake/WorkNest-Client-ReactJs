import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Users, UserCircle2, BriefcaseBusiness } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getTeamById } from "@/modules/teams/services/teamService";
import { getEmployees } from "@/modules/employees/services/employeeService";
import { getProjects } from "@/modules/projects/services/projectService";
import { getTasks } from "@/modules/tasks/services/taskService";
import { getEmployeeDisplayName } from "@/modules/employees/utils/employeeMapper";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AvatarInitials } from "@/components/common/AvatarInitials";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import type { Team } from "@/modules/teams/types";
import type { Employee } from "@/types";
import type { Project } from "@/modules/projects/types";
import type { Task } from "@/modules/tasks/types";

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  usePageMeta({ title: "Team Details", breadcrumb: ["Workspace", "Teams", "Details"] });

  const [team, setTeam] = useState<Team | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const resolvedError = !id ? "Invalid team id." : error;

  useEffect(() => {
    if (!id) return;

    let active = true;

    Promise.all([
      getTeamById(id),
      getEmployees().catch(() => []),
      getProjects().catch(() => []),
      getTasks().catch(() => []),
    ])
      .then(([teamRes, employeeRes, projectRes, taskRes]) => {
        if (!active) return;
        setTeam(teamRes);
        setEmployees(employeeRes);
        setProjects(projectRes);
        setTasks(taskRes);
      })
      .catch(() => {
        if (active) setError("Unable to load team details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  const members = useMemo(() => {
    if (!team) return [];
    return team.memberIds.map((memberId) => {
      const emp = employeeMap.get(memberId);
      return {
        id: memberId,
        name: emp ? getEmployeeDisplayName(emp) : memberId,
        email: typeof emp?.email === "string" ? emp.email : "",
      };
    });
  }, [employeeMap, team]);

  const assignedProjects = useMemo(() => {
    if (!team) return [];
    return projects.filter((project) => project.teamIds.includes(team.id));
  }, [projects, team]);

  const teamTasks = useMemo(() => {
    if (!team) return [];
    const memberSet = new Set(team.memberIds);
    return tasks.filter((task) => (task.assigneeId ? memberSet.has(task.assigneeId) : false));
  }, [tasks, team]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" to="/app/teams">
          <ArrowLeft size={16} />
          Back
        </Button>
        {team && (
          <Button variant="outline" to={`/app/teams/${team.id}/edit`}>Edit Team</Button>
        )}
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

      {!loading && !resolvedError && !team && (
        <EmptyState
          icon={<Users size={28} />}
          title="Team not found"
          description="The requested team does not exist."
          action={<Button variant="outline" to="/app/teams">Go to Teams</Button>}
        />
      )}

      {!loading && !resolvedError && team && (
        <>
          <SectionCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {team.name}
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {team.description || "No description provided."}
                </p>
              </div>
              <StatusBadge status={team.status} />
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard title="Team Manager">
              <div className="flex items-center gap-3">
                <AvatarInitials name={team.managerName || "Manager"} size="sm" />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{team.managerName || "—"}</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Team Lead</div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Member Count">
              <div className="flex items-center gap-2">
                <Users size={16} style={{ color: "var(--color-primary-500)" }} />
                <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{team.memberIds.length}</span>
              </div>
            </SectionCard>

            <SectionCard title="Workspace Scope">
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <BriefcaseBusiness size={16} style={{ color: "var(--color-primary-500)" }} />
                {assignedProjects.length} linked project{assignedProjects.length === 1 ? "" : "s"} and {teamTasks.length} assigned task{teamTasks.length === 1 ? "" : "s"}.
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Assigned Projects" subtitle="Projects currently linked to this team.">
            {assignedProjects.length === 0 && (
              <EmptyState
                icon={<BriefcaseBusiness size={22} />}
                title="No projects linked"
                description="Assign this team to projects to activate cross-module workflow."
              />
            )}

            {assignedProjects.length > 0 && (
              <div className="space-y-2">
                {assignedProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2" style={{ borderColor: "var(--border-default)" }}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {project.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {project.status.replace("_", " ")}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" to={`/app/projects/${project.id}`}>
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Team Members" subtitle="Current members assigned to this team.">
            {members.length === 0 && (
              <EmptyState
                icon={<UserCircle2 size={24} />}
                title="No members yet"
                description="Update this team to assign members."
              />
            )}

            {members.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-xl border p-3"
                    style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border-default)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <AvatarInitials name={member.name} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {member.name}
                        </div>
                        <div className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                          {member.email || "No email available"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}
