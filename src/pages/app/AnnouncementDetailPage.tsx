import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Pin, UserCircle2 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getAnnouncementById } from "@/modules/announcements/services/announcementService";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import type { Announcement } from "@/modules/announcements/types";

export function AnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  usePageMeta({ title: "Announcement Details", breadcrumb: ["Workspace", "Announcements", "Details"] });

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const resolvedError = !id ? "Invalid announcement id." : error;

  useEffect(() => {
    if (!id) return;

    let active = true;
    getAnnouncementById(id)
      .then((response) => {
        if (active) setAnnouncement(response);
      })
      .catch(() => {
        if (active) setError("Unable to load announcement.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" to="/app/announcements">
          <ArrowLeft size={16} />
          Back
        </Button>
        {announcement?.canEdit && <Button variant="outline" to={`/app/announcements/${announcement.id}/edit`}>Edit</Button>}
      </div>

      {loading && (
        <div className="py-24 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: "#9332EA", borderLeftColor: "rgba(147,50,234,0.3)" }} />
        </div>
      )}

      {!loading && resolvedError && <ErrorBanner message={resolvedError} />}

      {!loading && !resolvedError && !announcement && (
        <EmptyState
          title="Announcement not found"
          description="The requested announcement may no longer exist."
          action={<Button variant="outline" to="/app/announcements">Go to Announcements</Button>}
        />
      )}

      {!loading && !resolvedError && announcement && (
        <>
          <SectionCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {announcement.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <span className="inline-flex items-center gap-1.5">
                    <UserCircle2 size={14} />
                    {announcement.authorName}
                  </span>
                  <span>{new Date(announcement.createdAt).toLocaleString()}</span>
                </div>
              </div>
              {announcement.pinned && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: "rgba(147,50,234,0.12)", color: "var(--color-primary-600)" }}
                >
                  <Pin size={12} />
                  Pinned
                </span>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Message">
            <article className="whitespace-pre-line text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {announcement.content}
            </article>
          </SectionCard>
        </>
      )}
    </div>
  );
}
