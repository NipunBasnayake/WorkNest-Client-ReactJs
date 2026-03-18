import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { createAnnouncement, getAnnouncementById, updateAnnouncement } from "@/modules/announcements/services/announcementService";
import { DEFAULT_ANNOUNCEMENT_FORM, validateAnnouncementForm } from "@/modules/announcements/schemas/announcementForm";
import { AnnouncementForm } from "@/modules/announcements/components/AnnouncementForm";
import { SectionCard } from "@/components/common/SectionCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/AppUI";
import type { AnnouncementFormErrors, AnnouncementFormValues } from "@/modules/announcements/types";

export function AnnouncementFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { user } = useAuth();

  usePageMeta({
    title: isEdit ? "Edit Announcement" : "Create Announcement",
    breadcrumb: ["Workspace", "Announcements", isEdit ? "Edit" : "Create"],
  });

  const [form, setForm] = useState<AnnouncementFormValues>(DEFAULT_ANNOUNCEMENT_FORM);
  const [errors, setErrors] = useState<AnnouncementFormErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);
    getAnnouncementById(id)
      .then((item) => {
        if (!active) return;
        setForm({
          title: item.title,
          content: item.content,
          pinned: item.pinned,
        });
      })
      .catch(() => {
        if (active) setFatalError("Unable to load announcement.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const title = useMemo(() => (isEdit ? "Update Announcement" : "Create Announcement"), [isEdit]);

  async function handleSubmit() {
    if (!user) return;

    setMessage(null);
    const validation = validateAnnouncementForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      if (id) {
        await updateAnnouncement(id, form);
        setMessage("Announcement updated successfully.");
      } else {
        await createAnnouncement({
          ...form,
          authorId: user.id,
          authorName: user.name,
        });
        setMessage("Announcement published successfully.");
      }
      setTimeout(() => navigate("/app/announcements", { replace: true }), 500);
    } catch {
      setMessage("Unable to save announcement right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Publish updates and keep everyone aligned across the workspace."
        actions={(
          <Button variant="ghost" onClick={() => navigate("/app/announcements")}>
            <ArrowLeft size={16} />
            Back to Announcements
          </Button>
        )}
      />

      {loading && (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: "#9332EA", borderLeftColor: "rgba(147,50,234,0.3)" }} />
        </div>
      )}

      {!loading && fatalError && <ErrorBanner message={fatalError} />}

      {!loading && !fatalError && (
        <SectionCard title={isEdit ? "Edit Announcement" : "New Announcement"} subtitle="Clear and concise announcements improve team visibility.">
          {message && (
            <div
              className="mb-4 rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor: message.toLowerCase().includes("unable") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
                backgroundColor: message.toLowerCase().includes("unable") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
                color: message.toLowerCase().includes("unable") ? "#ef4444" : "#10b981",
              }}
            >
              {message}
            </div>
          )}

          <AnnouncementForm
            values={form}
            errors={errors}
            submitting={submitting}
            submitLabel={isEdit ? "Save Announcement" : "Publish Announcement"}
            onChange={(next) => {
              setForm(next);
              if (Object.keys(errors).length) setErrors({});
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/app/announcements")}
          />
        </SectionCard>
      )}
    </div>
  );
}
