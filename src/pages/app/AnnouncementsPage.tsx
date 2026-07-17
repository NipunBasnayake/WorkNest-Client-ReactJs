import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Edit2, Eye, Megaphone, Pin, PlusCircle, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { invalidateWorkflowQueries } from "@/hooks/queries/workflowInvalidation";
import { useAuth } from "@/hooks/useAuth";
import { canCreateAnnouncements, canDeleteAnnouncement, canEditAnnouncement } from "@/modules/announcements/access";
import { deleteAnnouncement, getAnnouncements } from "@/modules/announcements/services/announcementService";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { InlineAlert } from "@/components/common/InlineAlert";
import { SearchField } from "@/components/common/SearchField";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { Pagination } from "@/components/common/Pagination";
import { useClientPagination } from "@/hooks/useClientPagination";
import type { Announcement } from "@/modules/announcements/types";
import { getErrorMessage } from "@/utils/errorHandler";
import { tenantRoutes } from "@/utils/tenantRoutes";
import { Badge } from "@/components/common/Badge";

export function AnnouncementsPage() {
  usePageMeta({ title: "Announcements", breadcrumb: ["Workspace", "Announcements"] });
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
  const announcementPagination = useClientPagination(filtered, {
    storageKey: "announcements",
    resetKey: search,
  });

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

      <SectionCard variant="table" title="Published Announcements" subtitle="Workspace updates organized for quick scanning and management.">
        <div className="overflow-x-auto">
          <table className="worknest-data-table w-full min-w-[940px] text-left text-sm">
            <thead style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }}>
              <tr>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Audience</th>
                <th className="px-5 py-3 font-semibold">Published Date</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Author</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}><td colSpan={6}><SkeletonRow cols={6} /></td></tr>
              ))}
              {!loading && announcementPagination.paginatedItems.map((announcement) => (
                <tr key={announcement.id} className="transition-colors hover:bg-primary-500/[0.03]">
                  <td className="max-w-sm px-5 py-4">
                    <Link to={tenantRoutes.announcementDetail(announcement.id)} className="block no-underline hover:opacity-80">
                      <span className="block truncate font-semibold" style={{ color: "var(--text-primary)" }}>{announcement.title}</span>
                      <span className="mt-1 block truncate text-xs" style={{ color: "var(--text-tertiary)" }}>{announcement.content}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-4" style={{ color: "var(--text-secondary)" }}>{announcement.teamName || "All employees"}</td>
                  <td className="whitespace-nowrap px-5 py-4" style={{ color: "var(--text-secondary)" }}>{formatDate(announcement.createdAt)}</td>
                  <td className="px-5 py-4">
                    {announcement.pinned ? <Badge variant="info"><Pin size={12} />Pinned</Badge> : <Badge variant="success">Published</Badge>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="block font-medium" style={{ color: "var(--text-primary)" }}>{announcement.authorName}</span>
                    {announcement.authorRole && <span className="mt-0.5 block text-xs" style={{ color: "var(--text-tertiary)" }}>{toReadableRole(announcement.authorRole)}</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={tenantRoutes.announcementDetail(announcement.id)} title="View announcement" aria-label="View announcement" className="rounded-lg p-2 transition-colors hover:bg-primary-500/10" style={{ color: "var(--text-secondary)" }}><Eye size={15} /><span className="sr-only">View</span></Link>
                      {canEditAnnouncement(announcement) && <Link to={tenantRoutes.announcementEdit(announcement.id)} title="Edit announcement" aria-label="Edit announcement" className="rounded-lg p-2 transition-colors hover:bg-primary-500/10" style={{ color: "var(--text-secondary)" }}><Edit2 size={15} /><span className="sr-only">Edit</span></Link>}
                      {canDeleteAnnouncement(announcement) && <button type="button" onClick={() => setDeleteTarget(announcement)} title="Delete announcement" aria-label="Delete announcement" className="rounded-lg p-2 transition-colors hover:bg-red-500/10" style={{ color: "#ef4444" }}><Trash2 size={15} /><span className="sr-only">Delete</span></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !error && filtered.length === 0 && (
            <div className="p-8"><EmptyState icon={<Megaphone size={28} />} title={search ? "No matching announcements" : "No announcements yet"} description={search ? "Try another search term." : "Share updates and policy changes with your workspace."} action={canCreate ? <Button variant="outline" to={tenantRoutes.announcementNew()}>Create Announcement</Button> : undefined} /></div>
          )}
        </div>
        {!loading && !error && filtered.length > 0 && (
          <Pagination currentPage={announcementPagination.currentPage} totalItems={filtered.length} pageSize={announcementPagination.pageSize} onPageChange={announcementPagination.setCurrentPage} onPageSizeChange={announcementPagination.setPageSize} itemLabel="announcements" />
        )}
      </SectionCard>

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

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function toReadableRole(value: string): string {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
