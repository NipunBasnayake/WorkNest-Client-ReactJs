import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { DEFAULT_PERMISSION_DENIED_MESSAGE, PERMISSIONS } from "@/constants/permissions";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { getMyEmployeeProfile } from "@/modules/employees/services/employeeService";
import { createTask, getTaskById, updateTask } from "@/modules/tasks/services/taskService";
import { DEFAULT_TASK_FORM, validateTaskForm } from "@/modules/tasks/schemas/taskForm";
import { TaskForm } from "@/modules/tasks/components/TaskForm";
import { getProjects } from "@/modules/projects/services/projectService";
import { getTeams } from "@/modules/teams/services/teamService";
import { resolveViewerTeamRoles } from "@/modules/teams/utils/teamRoles";
import { SectionCard } from "@/components/common/SectionCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/AppUI";
import type { Project } from "@/modules/projects/types";
import type { TaskFormErrors, TaskFormValues } from "@/modules/tasks/types";
import type { Team } from "@/modules/teams/types";
import { getErrorMessage } from "@/utils/errorHandler";

interface Option {
  id: string;
  label: string;
}

export function TaskFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const requestedProjectId = searchParams.get("projectId")?.trim() ?? "";
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const canManageTasks = hasPermission(PERMISSIONS.TASKS_MANAGE);

  usePageMeta({
    title: isEdit ? "Edit Task" : "Create Task",
    breadcrumb: ["Workspace", "Tasks", isEdit ? "Edit" : "Create"],
  });

  const [form, setForm] = useState<TaskFormValues>(DEFAULT_TASK_FORM);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [projectCatalog, setProjectCatalog] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [viewerEmployeeId, setViewerEmployeeId] = useState<string | undefined>(undefined);
  const [dependencyLoadError, setDependencyLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    setDependencyLoadError(null);
    Promise.all([
      getProjects().catch(() => []),
      getTeams().catch(() => []),
      getMyEmployeeProfile().catch(() => null),
    ])
      .then(([projectRes, teamRes, profile]) => {
        setProjectCatalog(projectRes);
        setTeams(teamRes);
        setViewerEmployeeId(profile?.id);

        if (!isEdit && requestedProjectId && projectRes.some((project) => project.id === requestedProjectId)) {
          setForm((current) => (current.projectId ? current : { ...current, projectId: requestedProjectId }));
        }

        if (projectRes.length === 0) {
          setDependencyLoadError("Projects are required to create or edit tasks.");
          return;
        }

        if (teamRes.length === 0) {
          setDependencyLoadError("Team and project lists are required to create or edit tasks.");
        }
      })
      .catch((err: unknown) => {
        setDependencyLoadError(getErrorMessage(err, "Unable to load task dependencies."));
      });
  }, [isEdit, requestedProjectId]);

  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);

    getTaskById(id)
      .then((task) => {
        if (!active) return;
        setForm({
          title: task.title,
          description: task.description || "",
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          assignedTeamId: task.assignedTeamId || "",
          assigneeId: task.assigneeId || "",
          projectId: task.projectId || "",
          attachments: task.attachments,
        });
      })
      .catch(() => {
        if (active) setFatalError("Unable to load task for editing.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const title = useMemo(() => (isEdit ? "Update Task" : "Create Task"), [isEdit]);
  const projects = useMemo<Option[]>(
    () => projectCatalog.map((project) => ({ id: project.id, label: project.name })),
    [projectCatalog]
  );
  const selectedProject = useMemo(
    () => projectCatalog.find((project) => project.id === form.projectId) ?? null,
    [form.projectId, projectCatalog]
  );
  const scopedTeamRoles = useMemo(
    () =>
      resolveViewerTeamRoles(
        teams,
        { employeeId: viewerEmployeeId ?? user?.id, email: user?.email },
        selectedProject?.teamIds
      ),
    [selectedProject?.teamIds, teams, user?.email, user?.id, viewerEmployeeId]
  );
  const scopedAssignees = useMemo<Option[]>(() => {
    if (!selectedProject || !form.assignedTeamId) return [];

    const scopedTeamIds = new Set(selectedProject.teamIds);
    if (!scopedTeamIds.has(form.assignedTeamId)) {
      return [];
    }

    const optionMap = new Map<string, Option>();

    teams
      .filter((team) => team.id === form.assignedTeamId)
      .forEach((team) => {
        team.members.forEach((member) => {
          if (!member.employeeId || optionMap.has(member.employeeId)) return;
          optionMap.set(member.employeeId, {
            id: member.employeeId,
            label: member.name?.trim() || member.email?.trim() || member.employeeId,
          });
        });
      });

    return Array.from(optionMap.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [form.assignedTeamId, selectedProject, teams]);

  const teamOptions = useMemo<Option[]>(() => {
    if (!selectedProject) return [];
    const allowedTeamIds = new Set(selectedProject.teamIds);
    return teams
      .filter((team) => allowedTeamIds.has(team.id))
      .map((team) => ({ id: team.id, label: team.name }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [selectedProject, teams]);

  const assignees = scopedAssignees;
  const canAssignTask = hasPermission(PERMISSIONS.TASKS_ASSIGN, { teamRoles: scopedTeamRoles });
  const canSubmitTask = isEdit ? canManageTasks : canManageTasks || canAssignTask;
  const permissionHint = useMemo(() => {
    if (isEdit || canManageTasks) return null;
    if (!form.projectId) return "Select a project where you are a project manager or team lead to assign a task.";
    if (!canAssignTask) return DEFAULT_PERMISSION_DENIED_MESSAGE;
    if (assignees.length === 0) return "No team members are available for assignment on the selected project.";
    return null;
  }, [assignees.length, canAssignTask, canManageTasks, form.projectId, isEdit]);

  async function handleSubmit() {
    if (!canSubmitTask) {
      setMessage(DEFAULT_PERMISSION_DENIED_MESSAGE);
      return;
    }

    setMessage(null);
    const validation = validateTaskForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    const assignee = assignees.find((item) => item.id === form.assigneeId);
    const project = projects.find((item) => item.id === form.projectId);

    try {
      if (id) {
        await updateTask(id, {
          ...form,
          assignedTeamId: form.assignedTeamId || undefined,
          assignedEmployeeId: form.assigneeId || undefined,
          assigneeId: form.assigneeId || undefined,
          assigneeName: assignee?.label,
          projectId: form.projectId || undefined,
          projectName: project?.label,
        });
        setMessage("Task updated successfully.");
      } else {
        await createTask({
          ...form,
          assignedTeamId: form.assignedTeamId || undefined,
          assignedEmployeeId: form.assigneeId || undefined,
          assigneeId: form.assigneeId || undefined,
          assigneeName: assignee?.label,
          projectId: form.projectId || undefined,
          projectName: project?.label,
        });
        setMessage("Task created successfully.");
      }

      setTimeout(() => navigate("/app/tasks", { replace: true }), 500);
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Unable to save task right now."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Define task scope, owner, and due dates for smoother team execution."
        actions={(
          <Button variant="ghost" onClick={() => navigate("/app/tasks")}>
            <ArrowLeft size={16} />
            Back to Tasks
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
        <SectionCard title={isEdit ? "Edit Task Details" : "New Task"} subtitle="Use clear ownership and due dates to keep execution predictable.">
          {dependencyLoadError && <ErrorBanner message={dependencyLoadError} />}
          {permissionHint && !dependencyLoadError && <ErrorBanner message={permissionHint} />}

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

          <TaskForm
            values={form}
            errors={errors}
            teams={teamOptions}
            assignees={assignees}
            projects={projects}
            submitting={submitting}
            submitDisabled={!canSubmitTask}
            submitLabel={isEdit ? "Save Task" : "Create Task"}
            onChange={(next) => {
              setForm(next);
              if (Object.keys(errors).length) setErrors({});
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/app/tasks")}
          />
        </SectionCard>
      )}
    </div>
  );
}
