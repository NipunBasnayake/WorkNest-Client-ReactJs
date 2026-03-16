import { useEffect, useMemo, useState } from "react";
import { Search, Users, UserPlus2 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getTeams } from "@/modules/teams/services/teamService";
import { SectionCard } from "@/components/common/SectionCard";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import type { Team } from "@/modules/teams/types";

export function TeamsPage() {
  usePageMeta({ title: "Teams", breadcrumb: ["Workspace", "Teams"] });

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function fetchTeams() {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const response = await getTeams();
      setTeams(response);
    } catch {
      setError("Failed to load teams.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchTeams();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teams.filter((team) => {
      return !q || [team.name, team.description, team.managerName].some((value) => value?.toLowerCase().includes(q));
    });
  }, [search, teams]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Management"
        description={loading ? "Loading teams..." : `${teams.length} team${teams.length === 1 ? "" : "s"} configured.`}
        actions={(
          <Button variant="primary" to="/app/teams/new">
            <UserPlus2 size={16} />
            Add Team
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
            placeholder="Search by team name, manager, or description..."
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>
      </SectionCard>

      {error && <ErrorBanner message={error} onRetry={fetchTeams} />}

      <SectionCard className="overflow-hidden" contentClassName="p-0" title="Teams" subtitle="Structure your workforce by teams and managers.">
        <div
          className="hidden md:grid grid-cols-[2fr_1.6fr_0.8fr_0.8fr_1.4fr] gap-3 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
        >
          <span>Team</span>
          <span>Manager</span>
          <span>Members</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {loading && Array.from({ length: 5 }).map((_, idx) => <SkeletonRow key={idx} cols={5} />)}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={<Users size={28} />}
            title={search ? "No matching teams" : "No teams yet"}
            description={search ? "Try another search term." : "Create your first team to organize employees."}
            action={<Button variant="outline" to="/app/teams/new">Create Team</Button>}
          />
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="hidden md:block">
              {filtered.map((team) => (
                <div
                  key={team.id}
                  className="grid grid-cols-[2fr_1.6fr_0.8fr_0.8fr_1.4fr] items-center gap-3 border-b px-5 py-4"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{team.name}</div>
                    <div className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>{team.description || "No description"}</div>
                  </div>
                  <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>{team.managerName || "—"}</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{team.memberIds.length}</span>
                  <StatusBadge status={team.status} />
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="sm" to={`/app/teams/${team.id}`}>View</Button>
                    <Button variant="outline" size="sm" to={`/app/teams/${team.id}/edit`}>Edit</Button>
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
                      <div className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>{team.managerName}</div>
                      <div className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {team.memberIds.length} member{team.memberIds.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <StatusBadge status={team.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" to={`/app/teams/${team.id}`}>View</Button>
                    <Button variant="outline" size="sm" to={`/app/teams/${team.id}/edit`}>Edit</Button>
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
