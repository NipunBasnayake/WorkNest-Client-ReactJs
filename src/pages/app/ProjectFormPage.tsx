import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PERMISSIONS, DEFAULT_PERMISSION_DENIED_MESSAGE } from "@/constants/permissions";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { getMyEmployeeProfile } from "@/modules/employees/services/employeeService";
import { createProject, getProjectById, updateProject } from "@/modules/projects/services/projectService";
import { getTeams } from "@/modules/teams/services/teamService";
import { resolveViewerTeamRoles } from "@/modules/teams/utils/teamRoles";
import { DEFAULT_PROJECT_FORM, validateProjectForm } from "@/modules/projects/schemas/projectForm";
import { ProjectForm } from "@/modules/projects/components/ProjectForm";
import { SectionCard } from "@/components/common/SectionCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/AppUI";
import type { ProjectFormErrors, ProjectFormValues } from "@/modules/projects/types";
import type { Team } from "@/modules/teams/types";
import { getErrorMessage } from "@/utils/errorHandler";

export function ProjectFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const canManageProjects = hasPermission(PERMISSIONS.PROJECTS_MANAGE);

  usePageMeta({
    title: isEdit ? "Edit Project" : "Create Project",
    breadcrumb: ["Workspace", "Projects", isEdit ? "Edit" : "Create"],
  });

  const [form, setForm] = useState<ProjectFormValues>(DEFAULT_PROJECT_FORM);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [teams, setTeams] = useState<Team[]>([]);
  const [viewerEmployeeId, setViewerEmployeeId] = useState<string | undefined>(undefined);
  const [teamLoadError, setTeamLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    setTeamLoadError(null);
    const viewerProfilePromise = canManageProjects
      ? Promise.resolve(null)
      : getMyEmployeeProfile().catch(() => null);

    Promise.all([
      getTeams().catch((err: unknown) => {
        setTeamLoadError(getErrorMessage(err, "Unable to load teams for assignment."));
        return [];
      }),
      viewerProfilePromise,
    ]).then(([teamResult, profile]) => {
      setTeams(teamResult);
      setViewerEmployeeId(profile?.id);
    });
  }, [canManageProjects]);

  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);

    getProjectById(id)
      .then((project) => {
        if (!active) return;
        setForm({
          name: project.name,
          description: project.description ?? "",
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate ?? "",
          teamIds: project.teamIds,
          documents: project.documents,
        });
      })
      .catch(() => {
        if (active) setFatalError("Unable to load project for editing.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const title = useMemo(() => (isEdit ? "Update Project" : "Create Project"), [isEdit]);
  const projectScopedTeamRoles = useMemo(
    () =>
      resolveViewerTeamRoles(
        teams,
        { employeeId: viewerEmployeeId ?? user?.id, email: user?.email },
        form.teamIds
      ),
    [form.teamIds, teams, user?.email, user?.id, viewerEmployeeId]
  );
  const canEditProject = canManageProjects || (isEdit && hasPermission(PERMISSIONS.PROJECTS_EDIT, { teamRoles: projectScopedTeamRoles }));
  const canEditTeams = canManageProjects;

  useEffect(() => {
    if (isEdit && !loading && !canEditProject) {
      setFatalError(DEFAULT_PERMISSION_DENIED_MESSAGE);
    }
  }, [canEditProject, isEdit, loading]);

  async function handleSubmit() {
    if (!canEditProject) {
      setMessage(DEFAULT_PERMISSION_DENIED_MESSAGE);
      return;
    }

    setMessage(null);
    const validation = validateProjectForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      if (id) {
        await updateProject(id, form);
        setMessage("Project updated successfully.");
      } else {
        await createProject(form);
        setMessage("Project created successfully.");
      }

      setTimeout(() => navigate("/app/projects", { replace: true }), 500);
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Unable to save project right now."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Capture project goals, timelines, and team ownership."
        actions={(
          <Button variant="ghost" onClick={() => navigate("/app/projects")}>
            <ArrowLeft size={16} />
            Back to Projects
          </Button>
        )}
      />

      {loading && (
        <div className="py-20 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-transparent animate-spin"
            style={{ borderTopColor: "#9332EA", borderLeftColor: "rgba(147,50,234,0.3)" }}
          />
        </div>
      )}

      {!loading && fatalError && <ErrorBanner message={fatalError} />}

      {!loading && !fatalError && (
        <SectionCard title={isEdit ? "Edit Project Details" : "New Project"} subtitle="Set the scope and assign teams to kick off delivery.">
          {teamLoadError && <ErrorBanner message={teamLoadError} />}

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

          <ProjectForm
            values={form}
            errors={errors}
            teams={teams}
            submitting={submitting}
            canEditTeams={canEditTeams}
            submitLabel={isEdit ? "Save Project" : "Create Project"}
            onChange={(next) => {
              setForm(next);
              if (Object.keys(errors).length) setErrors({});
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/app/projects")}
          />
        </SectionCard>
      )}
    </div>
  );
}
