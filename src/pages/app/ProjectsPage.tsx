import { useEffect, useMemo, useState } from "react";
import { Calendar, Search, Trash2, FolderKanban } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getProjects, deleteProject } from "@/modules/projects/services/projectService";
import { getTeams } from "@/modules/teams/services/teamService";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { Project } from "@/modules/projects/types";
import type { Team } from "@/modules/teams/types";

export function ProjectsPage() {
  usePageMeta({ title: "Projects", breadcrumb: ["Workspace", "Projects"] });

  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  function fetchData() {
    setLoading(true);
    setError(null);
    Promise.all([getProjects(), getTeams()])
      .then(([projectRes, teamRes]) => {
        setProjects(projectRes);
        setTeams(teamRes);
      })
      .catch(() => setError("Failed to load projects."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchData();
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

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setFeedback(null);

    try {
      await deleteProject(deleteTarget.id);
      setProjects((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setFeedback("Project deleted successfully.");
    } catch {
      setFeedback("Could not delete project right now.");
    } finally {
      setDeleting(false);
    }
  }

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

      {feedback && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: feedback.toLowerCase().includes("could") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
            backgroundColor: feedback.toLowerCase().includes("could") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
            color: feedback.toLowerCase().includes("could") ? "#ef4444" : "#10b981",
          }}
        >
          {feedback}
        </div>
      )}

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
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(project)}>
                      <Trash2 size={14} />
                    </Button>
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
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(project)}>
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete project?"
        description={`This will remove ${deleteTarget?.name ?? "this project"} from your workspace records.`}
        confirmLabel="Delete Project"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
