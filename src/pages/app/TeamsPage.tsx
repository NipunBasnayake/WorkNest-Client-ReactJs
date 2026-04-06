import { useEffect, useMemo, useState } from "react";
import { Search, Users, UserPlus2 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { getTeams } from "@/modules/teams/services/teamService";
import { getProjects } from "@/modules/projects/services/projectService";
import { getMyEmployeeProfile } from "@/modules/employees/services/employeeService";
import { SectionCard } from "@/components/common/SectionCard";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import type { Team } from "@/modules/teams/types";
import type { Project } from "@/modules/projects/types";
import { getErrorMessage } from "@/utils/errorHandler";

interface ViewerContext {
  employeeId?: string;
  email?: string;
}

export function TeamsPage() {
  usePageMeta({ title: "Teams", breadcrumb: ["Workspace", "Teams"] });
  const { hasRole, user } = useAuth();

  const canManageTeams = hasRole("TENANT_ADMIN", "ADMIN", "MANAGER", "HR");
  const isEmployeeOnly = hasRole("EMPLOYEE") && !canManageTeams;

  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [viewer, setViewer] = useState<ViewerContext>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function fetchTeams() {
    setLoading(true);
    setError(null);
    try {
      const profilePromise = isEmployeeOnly
        ? getMyEmployeeProfile().catch(() => null)
        : Promise.resolve(null);

      const [teamResponse, projectResponse, myProfile] = await Promise.all([
        getTeams(),
        getProjects().catch(() => []),
        profilePromise,
      ]);

      setTeams(teamResponse);
      setProjects(projectResponse);
      setViewer({
        employeeId: myProfile?.id ?? user?.id,
        email: myProfile?.email ?? user?.email,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load teams."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchTeams();
  }, [isEmployeeOnly, user?.email, user?.id]);

  const projectCountByTeam = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      for (const teamId of project.teamIds) {
        counts.set(teamId, (counts.get(teamId) ?? 0) + 1);
      }
    }
    return counts;
  }, [projects]);

  const visibleTeams = useMemo(() => {
    if (!isEmployeeOnly) return teams;
    return teams.filter((team) => isTeamVisibleToEmployee(team, viewer));
  }, [isEmployeeOnly, teams, viewer]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleTeams.filter((team) => {
      if (!q) return true;
      return [
        team.name,
        team.description,
        team.managerName,
        ...team.members.map((member) => member.name ?? member.email ?? ""),
      ].some((value) => value?.toLowerCase().includes(q));
    });
  }, [search, visibleTeams]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployeeOnly ? "My Teams" : "Team Management"}
        description={
          loading
            ? "Loading teams..."
            : `${visibleTeams.length} team${visibleTeams.length === 1 ? "" : "s"} visible.`
        }
        actions={canManageTeams ? (
          <Button variant="primary" to="/app/teams/new">
            <UserPlus2 size={16} />
            Add Team
          </Button>
        ) : undefined}
      />

      <SectionCard>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team name, manager, members, or description..."
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>
      </SectionCard>

      {error && <ErrorBanner message={error} onRetry={fetchTeams} />}

      <SectionCard
        className="overflow-hidden"
        contentClassName="p-0"
        title={isEmployeeOnly ? "Team Visibility" : "Teams"}
        subtitle={isEmployeeOnly ? "Your team structure and manager context." : "Structure your workforce by teams and managers."}
      >
        <div
          className="hidden md:grid grid-cols-[2fr_1.3fr_0.8fr_0.8fr_0.8fr_1.7fr] gap-3 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
        >
          <span>Team</span>
          <span>Manager</span>
          <span>Members</span>
          <span>Projects</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {loading && Array.from({ length: 5 }).map((_, idx) => <SkeletonRow key={idx} cols={6} />)}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={<Users size={28} />}
            title={search ? "No matching teams" : (isEmployeeOnly ? "No teams assigned" : "No teams yet")}
            description={
              search
                ? "Try another search term."
                : isEmployeeOnly
                  ? "You are not assigned to a team yet. Contact your workspace admin."
                  : "Create your first team to organize employees."
            }
            action={canManageTeams ? <Button variant="outline" to="/app/teams/new">Create Team</Button> : undefined}
          />
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="hidden md:block">
              {filtered.map((team) => (
                <div
                  key={team.id}
                  className="grid grid-cols-[2fr_1.3fr_0.8fr_0.8fr_0.8fr_1.7fr] items-center gap-3 border-b px-5 py-4"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{team.name}</div>
                    <div className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>{team.description || "No description"}</div>
                  </div>
                  <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>{team.managerName || "-"}</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{team.memberIds.length}</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{projectCountByTeam.get(team.id) ?? 0}</span>
                  <StatusBadge status={team.status} />
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="sm" to={`/app/teams/${team.id}`}>View</Button>
                    {canManageTeams && <Button variant="outline" size="sm" to={`/app/teams/${team.id}/edit`}>Edit</Button>}
                    {canManageTeams && <Button variant="outline" size="sm" to={`/app/teams/${team.id}#members`}>Manage Members</Button>}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {filtered.map((team) => (
                <article
                  key={team.id}
                  className="rounded-xl border p-4"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{team.name}</div>
                      <div className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>Manager: {team.managerName || "-"}</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {team.memberIds.length} member{team.memberIds.length === 1 ? "" : "s"} · {projectCountByTeam.get(team.id) ?? 0} project{(projectCountByTeam.get(team.id) ?? 0) === 1 ? "" : "s"}
                      </div>
                    </div>
                    <StatusBadge status={team.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" to={`/app/teams/${team.id}`}>View</Button>
                    {canManageTeams && <Button variant="outline" size="sm" to={`/app/teams/${team.id}/edit`}>Edit</Button>}
                  </div>
                </article>
              ))}
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
