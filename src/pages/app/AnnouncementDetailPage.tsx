import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pin, Trash2, Users } from "lucide-react";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FileAssetList } from "@/components/common/FileAssetList";
import { SectionCard } from "@/components/common/SectionCard";
import { UserAvatar } from "@/components/common/UserAvatar";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { invalidateWorkflowQueries } from "@/hooks/queries/workflowInvalidation";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  canDeleteAnnouncement,
  canEditAnnouncement,
} from "@/modules/announcements/access";
import {
  deleteAnnouncement,
  getAnnouncementById,
  setAnnouncementPinned,
} from "@/modules/announcements/services/announcementService";
import type { Announcement } from "@/modules/announcements/types";
import { getErrorMessage } from "@/utils/errorHandler";
import { tenantRoutes } from "@/utils/tenantRoutes";

export function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  usePageMeta({
    title: "Announcement Details",
    breadcrumb: ["Workspace", "Announcements", "Details"],
  });

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pinning, setPinning] = useState(false);
  const resolvedError = !id ? "Invalid announcement id." : error;

  useEffect(() => {
    if (!id) return;
    let active = true;
    void getAnnouncementById(id)
      .then((response) => {
        if (active) setAnnouncement(response);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            getErrorMessage(loadError, "Unable to load announcement."),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function handleDelete() {
    if (!announcement) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deleteAnnouncement(announcement.id);
      queryClient.setQueryData<Announcement[]>(
        queryKeys.announcements(),
        (current = []) =>
          current.filter((item) => item.id !== announcement.id),
      );
      await invalidateWorkflowQueries(queryClient, ["announcements"]);
      navigate(tenantRoutes.announcements(), { replace: true });
    } catch (deleteError: unknown) {
      setActionError(
        getErrorMessage(deleteError, "Unable to delete announcement."),
      );
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handlePin() {
    if (!announcement) return;
    setPinning(true);
    setActionError(null);
    try {
      const updated = await setAnnouncementPinned(
        announcement.id,
        !announcement.pinned,
      );
      setAnnouncement({
        ...announcement,
        ...updated,
        attachments: announcement.attachments,
      });
      await invalidateWorkflowQueries(queryClient, ["announcements"]);
    } catch (pinError: unknown) {
      setActionError(
        getErrorMessage(pinError, "Unable to update the pinned state."),
      );
    } finally {
      setPinning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" to={tenantRoutes.announcements()}>
          <ArrowLeft size={16} />
          Back
        </Button>
        {announcement && canEditAnnouncement(announcement) && (
          <>
            <Button
              variant="outline"
              to={tenantRoutes.announcementEdit(announcement.id)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              disabled={pinning}
              loading={pinning}
              onClick={() => void handlePin()}
            >
              <Pin size={15} />
              {announcement.pinned ? "Unpin" : "Pin"}
            </Button>
          </>
        )}
        {announcement && canDeleteAnnouncement(announcement) && (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={16} color="#ef4444" />
            Delete
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-transparent"
            style={{
              borderTopColor: "var(--brand-action)",
              borderLeftColor: "var(--brand-border)",
            }}
          />
        </div>
      )}

      {!loading && resolvedError && <ErrorBanner message={resolvedError} />}
      {actionError && <ErrorBanner message={actionError} />}

      {!loading && !resolvedError && !announcement && (
        <EmptyState
          title="Announcement not found"
          description="The requested announcement may no longer exist."
          action={
            <Button variant="outline" to={tenantRoutes.announcements()}>
              Go to Announcements
            </Button>
          }
        />
      )}

      {!loading && !resolvedError && announcement && (
        <>
          <SectionCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h1
                  className="truncate text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {announcement.title}
                </h1>
                <div
                  className="mt-2 flex flex-wrap items-center gap-3 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <UserAvatar
                      name={announcement.authorName}
                      src={announcement.authorAvatarUrl}
                      size="xs"
                    />
                    {announcement.authorName}
                  </span>
                  {announcement.authorRole && (
                    <span>{readableRole(announcement.authorRole)}</span>
                  )}
                  {announcement.teamName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={14} />
                      {announcement.teamName}
                    </span>
                  ) : (
                    <span>All employees</span>
                  )}
                  <span>{formatDateTime(announcement.createdAt)}</span>
                </div>
              </div>
              {announcement.pinned && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{
                    background: "var(--brand-soft)",
                    color: "var(--color-primary-600)",
                  }}
                >
                  <Pin size={12} />
                  Pinned
                </span>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Message">
            <article
              className="whitespace-pre-line text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {announcement.content}
            </article>
          </SectionCard>

          <SectionCard title="Details">
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <Meta
                label="Audience"
                value={announcement.teamName ?? "All employees"}
              />
              <Meta
                label="Last updated"
                value={formatDateTime(announcement.updatedAt)}
              />
            </div>
          </SectionCard>

          <SectionCard title="Attachments">
            <FileAssetList
              items={announcement.attachments ?? []}
              emptyLabel="No files attached to this announcement."
            />
          </SectionCard>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete announcement?"
        description={`This will permanently remove "${
          announcement?.title ?? "this announcement"
        }" from the feed.`}
        confirmLabel="Delete Announcement"
        loading={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function readableRole(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </p>
      <p className="mt-1" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}
