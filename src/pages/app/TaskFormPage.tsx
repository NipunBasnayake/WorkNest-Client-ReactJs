import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { invalidateWorkflowQueries } from "@/hooks/queries/workflowInvalidation";
import { DEFAULT_PERMISSION_DENIED_MESSAGE, PERMISSIONS } from "@/constants/permissions";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { getMyEmployeeProfile } from "@/modules/employees/services/employeeService";
import { createTask, getTaskById, updateTask } from "@/modules/tasks/services/taskService";
import { DEFAULT_TASK_FORM, validateTaskForm } from "@/modules/tasks/schemas/taskForm";
import { TaskForm } from "@/modules/tasks/components/TaskForm";
import { hasTeamWorkflowAccess } from "@/modules/tasks/utils/taskWorkflow";
import { getProjects } from "@/modules/projects/services/projectService";
import { getAssignableTeamMembers, getTeams } from "@/modules/teams/services/teamService";
import { resolveViewerTeamRoles } from "@/modules/teams/utils/teamRoles";
import { SectionCard } from "@/components/common/SectionCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/AppUI";
import type { Project } from "@/modules/projects/types";
import type { TaskFormErrors, TaskFormValues } from "@/modules/tasks/types";
import type { AssignableTeamMember, Team } from "@/modules/teams/types";
import { getErrorMessage } from "@/utils/errorHandler";
import { tenantRoutes } from "@/utils/tenantRoutes";

interface Option {
  id: string;
  label: string;
  subtitle?: string;
  avatarUrl?: string;
}

export function TaskFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const requestedProjectId = searchParams.get("projectId")?.trim() ?? "";
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const roleValue = String(user?.role ?? "").toUpperCase();
  const hasGlobalTaskManagement = roleValue === "TENANT_ADMIN" || roleValue === "ADMIN";

  usePageMeta({
    title: isEdit ? "Edit Task" : "Create Task",
    breadcrumb: ["Workspace", "Tasks", isEdit ? "Edit" : "Create"],
  });

  const [form, setForm] = useState<TaskFormValues>(DEFAULT_TASK_FORM);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [projectCatalog, setProjectCatalog] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [assignableAssignees, setAssignableAssignees] = useState<Option[]>([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [assigneeLoadError, setAssigneeLoadError] = useState<string | null>(null);
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
        const openProjects = projectRes.filter((project) => !isClosedProject(project));
        setProjectCatalog(openProjects);
        setTeams(teamRes);
        setViewerEmployeeId(profile?.id);

        if (!isEdit && requestedProjectId) {
          const requestedProject = projectRes.find((project) => project.id === requestedProjectId);
          if (requestedProject && isClosedProject(requestedProject)) {
            setDependencyLoadError("The selected project is completed or cancelled and locked. Reopen the project before creating tasks.");
          } else if (requestedProject && !isClosedProject(requestedProject)) {
            setForm((current) => (current.projectId ? current : { ...current, projectId: requestedProjectId }));
          }
        }

        if (openProjects.length === 0) {
          setDependencyLoadError("An open project is required to create or edit tasks.");
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
        if (task.status === "DONE") {
          setFatalError("This task is DONE and locked. Reopen it from the task detail page before editing.");
          return;
        }
        setForm({
          title: task.title,
          description: task.description || "",
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          assignedTeamId: task.assignedTeamId || "",
          assigneeId: task.assignedEmployeeId || task.assigneeId || "",
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

  useEffect(() => {
    if (!form.assignedTeamId) {
      setAssignableAssignees([]);
      setAssigneeLoadError(null);
      setAssigneeLoading(false);
      return;
    }

    let active = true;
    setAssigneeLoading(true);
    setAssigneeLoadError(null);

    getAssignableTeamMembers(form.assignedTeamId)
      .then((members) => {
        if (!active) return;
        setAssignableAssignees(members.map(toAssigneeOption));
      })
      .catch((err: unknown) => {
        if (!active) return;
        setAssignableAssignees([]);
        setAssigneeLoadError(getErrorMessage(err, "Unable to load active team members for assignment."));
      })
      .finally(() => {
        if (active) setAssigneeLoading(false);
      });

    return () => {
      active = false;
    };
  }, [form.assignedTeamId]);

  const title = useMemo(() => (isEdit ? "Update Task" : "Create Task"), [isEdit]);
  const projects = useMemo<Option[]>(
    () => projectCatalog.map((project) => ({ id: project.id, label: project.name })),
    [projectCatalog]
  );
  const selectedProject = useMemo(
    () => projectCatalog.find((project) => project.id === form.projectId) ?? null,
    [form.projectId, projectCatalog]
  );
  const taskViewerIdentity = useMemo(
    () => ({ employeeId: viewerEmployeeId ?? user?.id, email: user?.email }),
    [user?.email, user?.id, viewerEmployeeId]
  );
  const scopedTeamRoles = useMemo(
    () => resolveViewerTeamRoles(teams, taskViewerIdentity, selectedProject?.teamIds),
    [selectedProject?.teamIds, taskViewerIdentity, teams]
  );
  const selectedTeamRoles = useMemo(
    () => resolveViewerTeamRoles(
      teams,
      taskViewerIdentity,
      form.assignedTeamId ? [form.assignedTeamId] : selectedProject?.teamIds
    ),
    [form.assignedTeamId, selectedProject?.teamIds, taskViewerIdentity, teams]
  );

  const teamOptions = useMemo<Option[]>(() => {
    if (!selectedProject) return [];
    const projectTeamIds = new Set(selectedProject.teamIds);
    const canAssignAcrossProject = hasGlobalTaskManagement || scopedTeamRoles.includes("PROJECT_MANAGER");
    return teams
      .filter((team) => {
        if (!projectTeamIds.has(team.id)) return false;
        if (canAssignAcrossProject) return true;
        return hasTeamWorkflowAccess(resolveViewerTeamRoles(teams, taskViewerIdentity, [team.id]));
      })
      .map((team) => ({ id: team.id, label: team.name }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [hasGlobalTaskManagement, scopedTeamRoles, selectedProject, taskViewerIdentity, teams]);

  const assignees = assignableAssignees;
  const canAssignTask = hasPermission(PERMISSIONS.TASKS_ASSIGN, { teamRoles: selectedTeamRoles });
  const hasProjectManagerAccess = scopedTeamRoles.includes("PROJECT_MANAGER");
  const canCreateTask = hasGlobalTaskManagement || canAssignTask;
  const canEditTask = hasGlobalTaskManagement || hasProjectManagerAccess;
  const canSubmitTask = isEdit ? canEditTask : canCreateTask;
  const permissionHint = useMemo(() => {
    if (isEdit && !canEditTask) return "Only tenant admins or project managers can edit task details.";
    if (!isEdit && !form.projectId) return "Select a project where you are a project manager or team lead to assign a task.";
    if (!isEdit && !canCreateTask) return DEFAULT_PERMISSION_DENIED_MESSAGE;
    if (assigneeLoadError) return assigneeLoadError;
    if (form.assignedTeamId && !assigneeLoading && assignees.length === 0) return "No active team members are available for assignment on the selected team.";
    return null;
  }, [assigneeLoadError, assigneeLoading, assignees.length, canCreateTask, canEditTask, form.assignedTeamId, form.projectId, isEdit]);

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

      await invalidateWorkflowQueries(queryClient, ["tasks"]);
      setTimeout(() => navigate(tenantRoutes.tasks(), { replace: true }), 500);
    } catch (err: unknown) {
      setMessage(getErrorMessage(err, "Unable to save task. Please verify the selected project, team, and assignee belong to your team."));
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
          <Button variant="ghost" onClick={() => navigate(tenantRoutes.tasks())}>
            <ArrowLeft size={16} />
            Back to Tasks
          </Button>
        )}
      />

      {loading && (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: "var(--brand-action)", borderLeftColor: "var(--brand-border)" }} />
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
            assigneeLoading={assigneeLoading}
            submitDisabled={!canSubmitTask}
            submitLabel={isEdit ? "Save Task" : "Create Task"}
            onChange={(next) => {
              setForm(next);
              if (Object.keys(errors).length) setErrors({});
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate(tenantRoutes.tasks())}
          />
        </SectionCard>
      )}
    </div>
  );
}

function toAssigneeOption(member: AssignableTeamMember): Option {
  const label = member.fullName?.trim() || member.email?.trim() || member.employeeId;
  const designation = member.designation?.trim();
  return {
    id: member.employeeId,
    label,
    subtitle: designation || undefined,
    avatarUrl: member.avatarUrl || member.avatar,
  };
}

function isClosedProject(project: Project): boolean {
  return project.status === "completed" || project.status === "cancelled";
}
