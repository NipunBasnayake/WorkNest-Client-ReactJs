import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/AppUI";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { invalidateWorkflowQueries } from "@/hooks/queries/workflowInvalidation";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { canCreateAnnouncements } from "@/modules/announcements/access";
import { AnnouncementForm } from "@/modules/announcements/components/AnnouncementForm";
import {
  DEFAULT_ANNOUNCEMENT_FORM,
  validateAnnouncementForm,
} from "@/modules/announcements/schemas/announcementForm";
import {
  createAnnouncement,
  getAnnouncementById,
  updateAnnouncement,
} from "@/modules/announcements/services/announcementService";
import type {
  Announcement,
  AnnouncementFormErrors,
  AnnouncementFormValues,
} from "@/modules/announcements/types";
import { getTeams } from "@/modules/teams/services/teamService";
import { getErrorMessage } from "@/utils/errorHandler";
import { tenantRoutes } from "@/utils/tenantRoutes";

export function AnnouncementFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const canCreate = canCreateAnnouncements(user?.role);

  usePageMeta({
    title: isEdit ? "Edit Announcement" : "Create Announcement",
    breadcrumb: [
      "Workspace",
      "Announcements",
      isEdit ? "Edit" : "Create",
    ],
  });

  const [form, setForm] = useState<AnnouncementFormValues>(
    DEFAULT_ANNOUNCEMENT_FORM,
  );
  const [errors, setErrors] = useState<AnnouncementFormErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [teamOptions, setTeamOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  useEffect(() => {
    if (!canCreate) return;
    let active = true;
    void getTeams()
      .then((teams) => {
        if (active) {
          setTeamOptions(
            teams.map((team) => ({ value: team.id, label: team.name })),
          );
        }
      })
      .catch(() => {
        if (active) setTeamOptions([]);
      });
    return () => {
      active = false;
    };
  }, [canCreate]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setFatalError(
        canCreate ? null : "You are not allowed to manage announcements.",
      );
      return;
    }

    let active = true;
    setLoading(true);
    setFatalError(null);
    void getAnnouncementById(id)
      .then((item) => {
        if (!active) return;
        if (!item.canEdit) {
          setFatalError(
            "You can edit only announcements you are allowed to manage.",
          );
          return;
        }
        setForm({
          title: item.title,
          content: item.content,
          pinned: item.pinned,
          teamId: item.teamId ?? "",
          attachments: item.attachments ?? [],
        });
      })
      .catch((error: unknown) => {
        if (active) {
          setFatalError(
            getErrorMessage(error, "Unable to load announcement."),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canCreate, id]);

  const title = useMemo(
    () => (isEdit ? "Update Announcement" : "Create Announcement"),
    [isEdit],
  );

  async function handleSubmit() {
    if (!user || !canCreate) {
      setMessage("You are not allowed to manage announcements.");
      return;
    }

    setMessage(null);
    const validation = validateAnnouncementForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      const saved = id
        ? await updateAnnouncement(id, form)
        : await createAnnouncement(form);
      queryClient.setQueryData<Announcement[]>(
        queryKeys.announcements(),
        (current = []) =>
          sortAnnouncements([
            saved,
            ...current.filter((item) => item.id !== saved.id),
          ]),
      );
      await invalidateWorkflowQueries(queryClient, ["announcements"]);
      navigate(tenantRoutes.announcements(), { replace: true });
    } catch (error: unknown) {
      setMessage(
        getErrorMessage(error, "Unable to save announcement right now."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Publish updates and keep everyone aligned across the workspace."
        actions={
          <Button
            variant="ghost"
            onClick={() => navigate(tenantRoutes.announcements())}
          >
            <ArrowLeft size={16} />
            Back to Announcements
          </Button>
        }
      />

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-transparent"
            style={{
              borderTopColor: "var(--brand-action)",
              borderLeftColor: "var(--brand-border)",
            }}
          />
        </div>
      )}

      {!loading && fatalError && <ErrorBanner message={fatalError} />}

      {!loading && !fatalError && (
        <SectionCard
          title={isEdit ? "Edit Announcement" : "New Announcement"}
          subtitle="Create a company-wide update or select one team."
        >
          {message && <ErrorBanner message={message} />}
          <AnnouncementForm
            values={form}
            errors={errors}
            submitting={submitting}
            submitLabel={
              isEdit ? "Save Announcement" : "Publish Announcement"
            }
            teamOptions={teamOptions}
            onChange={(next) => {
              setForm(next);
              if (Object.keys(errors).length > 0) setErrors({});
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate(tenantRoutes.announcements())}
          />
        </SectionCard>
      )}
    </div>
  );
}

function sortAnnouncements(items: Announcement[]): Announcement[] {
  return items.slice().sort((left, right) => {
    if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
    return right.createdAt.localeCompare(left.createdAt);
  });
}
