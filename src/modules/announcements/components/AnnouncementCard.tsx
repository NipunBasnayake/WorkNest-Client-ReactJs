import { Pin, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Announcement } from "@/modules/announcements/types";

interface AnnouncementCardProps {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  return (
    <Link
      to={`/app/announcements/${announcement.id}`}
      className="block rounded-2xl border p-5 no-underline transition-colors hover:bg-primary-50/30 dark:hover:bg-primary-950/10"
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {announcement.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {announcement.content}
          </p>
        </div>
        {announcement.pinned && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: "rgba(147,50,234,0.12)", color: "var(--color-primary-600)" }}
          >
            <Pin size={12} />
            Pinned
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
        <span className="inline-flex items-center gap-1">
          <UserCircle2 size={12} />
          {announcement.authorName}
        </span>
        <span>{formatDate(announcement.createdAt)}</span>
      </div>
    </Link>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
