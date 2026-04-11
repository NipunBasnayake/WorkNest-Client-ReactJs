import { useEffect, useMemo, useState } from "react";
import { Megaphone, PlusCircle, Search, Trash2 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { deleteAnnouncement, getAnnouncements } from "@/modules/announcements/services/announcementService";
import { AnnouncementCard } from "@/modules/announcements/components/AnnouncementCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import type { Announcement } from "@/modules/announcements/types";

export function AnnouncementsPage() {
  usePageMeta({ title: "Announcements", breadcrumb: ["Workspace", "Announcements"] });
  const { hasPermission } = usePermission();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = hasPermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);

  async function fetchAnnouncements() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch {
      setError("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return announcements;
    return announcements.filter((item) =>
      [item.title, item.content, item.authorName]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [announcements, search]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setFeedback(null);
    try {
      await deleteAnnouncement(deleteTarget.id);
      setAnnouncements((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setFeedback("Announcement deleted successfully.");
    } catch {
      setFeedback("Unable to delete announcement right now.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description={loading ? "Loading announcements..." : `${announcements.length} announcement${announcements.length === 1 ? "" : "s"} published.`}
        actions={canManage ? (
          <Button variant="primary" to="/app/announcements/new">
            <PlusCircle size={16} />
            New Announcement
          </Button>
        ) : undefined}
      />

      <SectionCard>
        <div className="relative max-w-lg">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, content, or author..."
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>
      </SectionCard>

      {feedback && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: feedback.toLowerCase().includes("unable") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
            backgroundColor: feedback.toLowerCase().includes("unable") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
            color: feedback.toLowerCase().includes("unable") ? "#ef4444" : "#10b981",
          }}
        >
          {feedback}
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={fetchAnnouncements} />}

      {loading && (
        <SectionCard>
          <div className="h-56 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        </SectionCard>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={<Megaphone size={28} />}
          title={search ? "No matching announcements" : "No announcements yet"}
          description={search ? "Try another search term." : "Share updates and policy changes with your workspace."}
          action={canManage ? <Button variant="outline" to="/app/announcements/new">Create Announcement</Button> : undefined}
        />
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((announcement) => (
            <div key={announcement.id} className="space-y-2">
              <AnnouncementCard announcement={announcement} />
              {canManage && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" to={`/app/announcements/${announcement.id}/edit`}>Edit</Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(announcement)}>
                    <Trash2 size={14} color="#ef4444" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete announcement?"
        description={`This will remove "${deleteTarget?.title ?? "this announcement"}" from the feed.`}
        confirmLabel="Delete Announcement"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
