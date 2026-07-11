import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { invalidateWorkflowQueries } from "@/hooks/queries/workflowInvalidation";
import { useAuth } from "@/hooks/useAuth";
import { canCreateAnnouncements, canDeleteAnnouncement, canEditAnnouncement } from "@/modules/announcements/access";
import { deleteAnnouncement, getAnnouncements } from "@/modules/announcements/services/announcementService";
import { AnnouncementCard } from "@/modules/announcements/components/AnnouncementCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { InlineAlert } from "@/components/common/InlineAlert";
import { SearchField } from "@/components/common/SearchField";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import type { Announcement } from "@/modules/announcements/types";
import { getErrorMessage } from "@/utils/errorHandler";
import { tenantRoutes } from "@/utils/tenantRoutes";

export function AnnouncementsPage() {
  usePageMeta({ title: "Announcements", breadcrumb: ["Workspace", "Announcements"] });
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canCreate = canCreateAnnouncements(user?.role);

  async function fetchAnnouncements() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load announcements."));
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
      await invalidateWorkflowQueries(queryClient, ["announcements"]);
      setDeleteTarget(null);
      setFeedback("Announcement deleted successfully.");
    } catch (err: unknown) {
      setFeedback(getErrorMessage(err, "Unable to delete announcement right now."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description={loading ? "Loading announcements..." : `${announcements.length} announcement${announcements.length === 1 ? "" : "s"} published.`}
        actions={canCreate ? (
          <Button variant="primary" to={tenantRoutes.announcementNew()}>
            <PlusCircle size={16} />
            New Announcement
          </Button>
        ) : undefined}
      />

      <SectionCard>
        <div className="max-w-lg">
          <SearchField
            label="Search announcements"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, content, or author..."
          />
        </div>
      </SectionCard>

      {feedback && (
        <InlineAlert tone={feedback.toLowerCase().includes("unable") ? "error" : "success"} message={feedback} />
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
          action={canCreate ? <Button variant="outline" to={tenantRoutes.announcementNew()}>Create Announcement</Button> : undefined}
        />
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onEdit={canEditAnnouncement(announcement) ? (ann) => navigate(tenantRoutes.announcementEdit(ann.id)) : undefined}
              onDelete={canDeleteAnnouncement(announcement) ? setDeleteTarget : undefined}
            />
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
