import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Edit2,
  Eye,
  Megaphone,
  Pin,
  PinOff,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { InlineAlert } from "@/components/common/InlineAlert";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { SearchField } from "@/components/common/SearchField";
import { SectionCard } from "@/components/common/SectionCard";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { invalidateWorkflowQueries } from "@/hooks/queries/workflowInvalidation";
import { useAuth } from "@/hooks/useAuth";
import { useClientPagination } from "@/hooks/useClientPagination";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  canCreateAnnouncements,
  canDeleteAnnouncement,
  canEditAnnouncement,
} from "@/modules/announcements/access";
import {
  deleteAnnouncement,
  getAnnouncements,
  setAnnouncementPinned,
} from "@/modules/announcements/services/announcementService";
import type { Announcement } from "@/modules/announcements/types";
import { subscribeRealtime } from "@/services/realtime/stompService";
import { getErrorMessage } from "@/utils/errorHandler";
import { tenantRoutes } from "@/utils/tenantRoutes";

export function AnnouncementsPage() {
  usePageMeta({
    title: "Announcements",
    breadcrumb: ["Workspace", "Announcements"],
  });
  const queryClient = useQueryClient();
  const { user, tenantKey } = useAuth();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const canCreate = canCreateAnnouncements(user?.role);

  const announcementsQuery = useQuery({
    queryKey: queryKeys.announcements(),
    queryFn: getAnnouncements,
  });
  const announcements = useMemo(
    () => announcementsQuery.data ?? [],
    [announcementsQuery.data],
  );
  const loading = announcementsQuery.isLoading;
  const error = announcementsQuery.error
    ? getErrorMessage(
        announcementsQuery.error,
        "Failed to load announcements.",
      )
    : null;

  useEffect(() => {
    if (!tenantKey) return;
    return subscribeRealtime(
      [`/topic/tenant/${tenantKey}/announcements`],
      () =>
        void queryClient.invalidateQueries({
          queryKey: queryKeys.announcements(),
        }),
    );
  }, [queryClient, tenantKey]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return announcements;
    return announcements.filter((item) =>
      [item.title, item.content, item.authorName, item.teamName ?? ""].some(
        (value) => value.toLowerCase().includes(query),
      ),
    );
  }, [announcements, search]);

  const pagination = useClientPagination(filtered, {
    storageKey: "announcements",
    resetKey: search,
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setFeedback(null);
    try {
      await deleteAnnouncement(deleteTarget.id);
      queryClient.setQueryData<Announcement[]>(
        queryKeys.announcements(),
        (current = []) =>
          current.filter((item) => item.id !== deleteTarget.id),
      );
      await invalidateWorkflowQueries(queryClient, ["announcements"]);
      setDeleteTarget(null);
      setFeedback("Announcement deleted successfully.");
    } catch (deleteError: unknown) {
      setFeedback(
        getErrorMessage(
          deleteError,
          "Unable to delete announcement right now.",
        ),
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handlePin(announcement: Announcement) {
    setPinningId(announcement.id);
    setFeedback(null);
    try {
      const updated = await setAnnouncementPinned(
        announcement.id,
        !announcement.pinned,
      );
      queryClient.setQueryData<Announcement[]>(
        queryKeys.announcements(),
        (current = []) =>
          sortAnnouncements(
            current.map((item) =>
              item.id === updated.id
                ? { ...item, ...updated, attachments: item.attachments }
                : item,
            ),
          ),
      );
      await invalidateWorkflowQueries(queryClient, ["announcements"]);
      setFeedback(
        updated.pinned
          ? "Announcement pinned successfully."
          : "Announcement unpinned successfully.",
      );
    } catch (pinError: unknown) {
      setFeedback(
        getErrorMessage(pinError, "Unable to update the pinned state."),
      );
    } finally {
      setPinningId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description={
          loading
            ? "Loading announcements..."
            : `${announcements.length} announcement${
                announcements.length === 1 ? "" : "s"
              } available.`
        }
        actions={
          canCreate ? (
            <Button variant="primary" to={tenantRoutes.announcementNew()}>
              <PlusCircle size={16} />
              New Announcement
            </Button>
          ) : undefined
        }
      />

      <SectionCard>
        <div className="max-w-lg">
          <SearchField
            label="Search announcements"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, content, author, or team..."
          />
        </div>
      </SectionCard>

      {feedback && (
        <InlineAlert
          tone={
            feedback.toLowerCase().includes("unable") ? "error" : "success"
          }
          message={feedback}
        />
      )}
      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => void announcementsQuery.refetch()}
        />
      )}

      <SectionCard
        variant="table"
        title="Announcement register"
        subtitle="Company-wide and team announcements."
      >
        <div className="overflow-x-auto">
          <table className="worknest-data-table w-full min-w-[1040px] text-left text-sm">
            <thead
              style={{
                backgroundColor: "var(--bg-muted)",
                color: "var(--text-secondary)",
              }}
            >
              <tr>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Audience</th>
                <th className="px-5 py-3 font-semibold">Pinned</th>
                <th className="px-5 py-3 font-semibold">Created By</th>
                <th className="px-5 py-3 font-semibold">Created At</th>
                <th className="px-5 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={6}>
                      <SkeletonRow cols={6} />
                    </td>
                  </tr>
                ))}
              {!loading &&
                pagination.paginatedItems.map((announcement) => (
                  <tr
                    key={announcement.id}
                    className="transition-colors hover:bg-primary-500/[0.03]"
                  >
                    <td className="max-w-sm px-5 py-4">
                      <Link
                        to={tenantRoutes.announcementDetail(announcement.id)}
                        className="block no-underline hover:opacity-80"
                      >
                        <span
                          className="block truncate font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {announcement.title}
                        </span>
                        <span
                          className="mt-1 block truncate text-xs"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {announcement.content}
                        </span>
                      </Link>
                    </td>
                    <td
                      className="px-5 py-4"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {announcement.teamName ?? "All employees"}
                    </td>
                    <td className="px-5 py-4">
                      {announcement.pinned ? (
                        <Badge variant="info">
                          <Pin size={12} />
                          Pinned
                        </Badge>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="block font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {announcement.authorName}
                      </span>
                      {announcement.authorRole && (
                        <span
                          className="mt-0.5 block text-xs"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {readableRole(announcement.authorRole)}
                        </span>
                      )}
                    </td>
                    <td
                      className="whitespace-nowrap px-5 py-4"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {formatDate(announcement.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={tenantRoutes.announcementDetail(announcement.id)}
                          title="View announcement"
                          aria-label="View announcement"
                          className="rounded-lg p-2"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <Eye size={15} />
                          <span className="sr-only">View</span>
                        </Link>
                        {canEditAnnouncement(announcement) && (
                          <>
                            <button
                              type="button"
                              disabled={pinningId === announcement.id}
                              onClick={() => void handlePin(announcement)}
                              title={
                                announcement.pinned
                                  ? "Unpin announcement"
                                  : "Pin announcement"
                              }
                              aria-label={
                                announcement.pinned
                                  ? "Unpin announcement"
                                  : "Pin announcement"
                              }
                              className="rounded-lg p-2 disabled:opacity-50"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {announcement.pinned ? (
                                <PinOff size={15} />
                              ) : (
                                <Pin size={15} />
                              )}
                            </button>
                            <Link
                              to={tenantRoutes.announcementEdit(
                                announcement.id,
                              )}
                              title="Edit announcement"
                              aria-label="Edit announcement"
                              className="rounded-lg p-2"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              <Edit2 size={15} />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </>
                        )}
                        {canDeleteAnnouncement(announcement) && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(announcement)}
                            title="Delete announcement"
                            aria-label="Delete announcement"
                            className="rounded-lg p-2"
                            style={{ color: "#ef4444" }}
                          >
                            <Trash2 size={15} />
                            <span className="sr-only">Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!loading && !error && filtered.length === 0 && (
            <div className="p-8">
              <EmptyState
                icon={<Megaphone size={28} />}
                title={
                  search ? "No matching announcements" : "No announcements yet"
                }
                description={
                  search
                    ? "Try another search term."
                    : "Share an update with all employees or one team."
                }
                action={
                  canCreate && !search ? (
                    <Button
                      variant="outline"
                      to={tenantRoutes.announcementNew()}
                    >
                      Create Announcement
                    </Button>
                  ) : undefined
                }
              />
            </div>
          )}
        </div>
        {!loading && !error && filtered.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalItems={filtered.length}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setCurrentPage}
            onPageSizeChange={pagination.setPageSize}
            itemLabel="announcements"
          />
        )}
      </SectionCard>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete announcement?"
        description={`This will permanently remove "${
          deleteTarget?.title ?? "this announcement"
        }" from the feed.`}
        confirmLabel="Delete Announcement"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function sortAnnouncements(items: Announcement[]): Announcement[] {
  return items.slice().sort((left, right) => {
    if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
    return right.createdAt.localeCompare(left.createdAt);
  });
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function readableRole(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
