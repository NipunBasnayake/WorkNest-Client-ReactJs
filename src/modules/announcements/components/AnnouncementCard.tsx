import { Pin, Users, Edit2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Announcement } from "@/modules/announcements/types";
import { tenantRoutes } from "@/utils/tenantRoutes";
import { UserAvatar } from "@/components/common/UserAvatar";

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
}

export function AnnouncementCard({ announcement, onEdit, onDelete }: AnnouncementCardProps) {
  return (
    <div
      className="block rounded-2xl border p-5 transition-colors"
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          to={tenantRoutes.announcementDetail(announcement.id)}
          className="min-w-0 flex-1 no-underline hover:opacity-80 transition-opacity"
        >
          <h3 className="truncate text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {announcement.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {announcement.content}
          </p>
        </Link>
        <div className="flex items-center gap-2">
          {announcement.pinned && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: "var(--brand-soft)", color: "var(--color-primary-600)" }}
            >
              <Pin size={12} />
              Pinned
            </span>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onEdit(announcement);
              }}
              className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-950/20 transition-colors"
              title="Edit announcement"
              aria-label="Edit announcement"
              style={{ color: "var(--text-secondary)" }}
            >
              <Edit2 size={16} />
              <span className="sr-only">Edit</span>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onDelete(announcement);
              }}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/20 transition-colors"
              title="Delete announcement"
              aria-label="Delete announcement"
              style={{ color: "#ef4444" }}
            >
              <Trash2 size={16} />
              <span className="sr-only">Delete</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
        <span className="inline-flex items-center gap-1">
          <UserAvatar name={announcement.authorName} src={announcement.authorAvatarUrl} size="xs" />
          {announcement.authorName}
        </span>
        {announcement.authorRole && <span>{toReadableRole(announcement.authorRole)}</span>}
        {announcement.teamName && (
          <span className="inline-flex items-center gap-1">
            <Users size={12} />
            {announcement.teamName}
          </span>
        )}
        <span>{formatDate(announcement.createdAt)}</span>
      </div>
    </div>
  );
}

function toReadableRole(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
