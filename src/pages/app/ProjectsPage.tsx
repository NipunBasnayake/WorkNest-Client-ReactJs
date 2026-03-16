import { useEffect, useMemo, useState } from "react";
import { Calendar, Search, FolderKanban } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getProjects } from "@/modules/projects/services/projectService";
import { getTeams } from "@/modules/teams/services/teamService";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import type { Project } from "@/modules/projects/types";
import type { Team } from "@/modules/teams/types";

export function ProjectsPage() {
  usePageMeta({ title: "Projects", breadcrumb: ["Workspace", "Projects"] });

  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function fetchData() {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const [projectRes, teamRes] = await Promise.all([getProjects(), getTeams()]);
      setProjects(projectRes);
      setTeams(teamRes);
    } catch {
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, []);

  const teamNameMap = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((team) => map.set(team.id, team.name));
    return map;
  }, [teams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((project) => {
      return !q || [project.name, project.description, project.status].some((value) => value?.toLowerCase().includes(q));
    });
  }, [projects, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Management"
        description={loading ? "Loading projects..." : `${projects.length} project${projects.length === 1 ? "" : "s"} tracked.`}
        actions={(
          <Button variant="primary" to="/app/projects/new">
            <FolderKanban size={16} />
            Add Project
          </Button>
        )}
      />

      <SectionCard>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, status, or description..."
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>
      </SectionCard>

      {error && <ErrorBanner message={error} onRetry={fetchData} />}

      <SectionCard className="overflow-hidden" contentClassName="p-0" title="Projects" subtitle="Monitor status, deadlines, and ownership across teams.">
        <div
          className="hidden md:grid grid-cols-[1.8fr_0.9fr_0.9fr_0.9fr_1.3fr_1.4fr] gap-3 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
        >
          <span>Project</span>
          <span>Status</span>
          <span>Progress</span>
          <span>Teams</span>
          <span>Timeline</span>
          <span className="text-right">Actions</span>
        </div>

        {loading && Array.from({ length: 5 }).map((_, idx) => <SkeletonRow key={idx} cols={6} />)}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={<FolderKanban size={28} />}
            title={search ? "No matching projects" : "No projects yet"}
            description={search ? "Try a different search term." : "Create your first project to start tracking delivery."}
            action={<Button variant="outline" to="/app/projects/new">Create Project</Button>}
          />
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="hidden md:block">
              {filtered.map((project) => (
                <div
                  key={project.id}
                  className="grid grid-cols-[1.8fr_0.9fr_0.9fr_0.9fr_1.3fr_1.4fr] items-center gap-3 border-b px-5 py-4"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{project.name}</div>
                    <div className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>{project.description || "No description"}</div>
                  </div>
                  <StatusBadge status={project.status} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{project.progress}%</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{project.teamIds.length}</span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {project.startDate || "—"} {project.endDate ? `→ ${project.endDate}` : ""}
                  </span>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="sm" to={`/app/projects/${project.id}`}>View</Button>
                    <Button variant="outline" size="sm" to={`/app/projects/${project.id}/edit`}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {filtered.map((project) => (
                <article
                  key={project.id}
                  className="rounded-xl border p-4"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{project.name}</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{project.progress}% complete</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                        Teams: {project.teamIds.map((teamId) => teamNameMap.get(teamId) ?? teamId).join(", ") || "None"}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                        <Calendar size={12} />
                        {project.startDate} {project.endDate ? `→ ${project.endDate}` : ""}
                      </div>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" to={`/app/projects/${project.id}`}>View</Button>
                    <Button variant="outline" size="sm" to={`/app/projects/${project.id}/edit`}>Edit</Button>
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
