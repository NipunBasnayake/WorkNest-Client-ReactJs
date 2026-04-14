import { useMemo, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, FolderKanban, MessageSquareText, UserCircle2 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { isTaskAssignedToViewer } from "@/modules/tasks/services/taskService";
import type { TaskViewerIdentity } from "@/modules/tasks/services/taskService";
import { TaskPriorityBadge } from "@/modules/tasks/components/TaskPriorityBadge";
import { TaskStatusBadge } from "@/modules/tasks/components/TaskStatusBadge";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/AsyncStates";
import { FileAssetList } from "@/components/common/FileAssetList";
import { useToast } from "@/hooks/useToast";
import { useProjectsQuery, useTeamsQuery } from "@/hooks/queries/useCoreQueries";
import {
  useTaskCommentsQuery,
  useTaskDetailQuery,
  useTaskMutations,
  useTaskViewerIdentityQuery,
} from "@/hooks/queries/useTaskDetailQueries";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  type TaskComment,
  type TaskPriority,
  type TaskStatus,
} from "@/modules/tasks/types";
import { resolveViewerTeamRoles } from "@/modules/teams/utils/teamRoles";
import { getTaskAllowedStatuses, hasTeamWorkflowAccess } from "@/modules/tasks/utils/taskWorkflow";
import { getErrorMessage } from "@/utils/errorHandler";
import { formatDate, formatDateTime, toReadableLabel } from "@/utils/formatting";

interface Option {
  id: string;
  label: string;
}

const EMPTY_COMMENTS: TaskComment[] = [];

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  usePageMeta({ title: "Task Details", breadcrumb: ["Workspace", "Tasks", "Details"] });

  const { role, user } = useAuth();
  const { hasPermission } = usePermission();
  const toast = useToast();

  const canManageTasks = hasPermission(PERMISSIONS.TASKS_MANAGE);
  const isEmployeeOnly = role === "EMPLOYEE" && !canManageTasks;

  const taskQuery = useTaskDetailQuery(id, Boolean(id));
  const commentsQuery = useTaskCommentsQuery(id, Boolean(id));
  const viewerIdentityQuery = useTaskViewerIdentityQuery(Boolean(id && isEmployeeOnly));
  const projectsQuery = useProjectsQuery(Boolean(id));
  const teamsQuery = useTeamsQuery(Boolean(id));

  const {
    updateStatusMutation,
    updatePriorityMutation,
    updateDueDateMutation,
    updateAssigneeMutation,
    updateTaskMutation,
    addCommentMutation,
  } = useTaskMutations({ taskId: id });

  const task = taskQuery.data ?? null;
  const comments = commentsQuery.data ?? EMPTY_COMMENTS;
  const viewerIdentity = viewerIdentityQuery.data as TaskViewerIdentity | undefined;

  const [commentDraft, setCommentDraft] = useState("");
  const [draftTaskId, setDraftTaskId] = useState<string | null>(null);
  const [dueDateDraft, setDueDateDraft] = useState<string | null>(null);
  const [assigneeDraft, setAssigneeDraft] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState<string | null>(null);

  const isDraftForCurrentTask = Boolean(task && draftTaskId === task.id);
  const effectiveDueDateDraft = isDraftForCurrentTask ? (dueDateDraft ?? "") : (task?.dueDate ?? "");
  const effectiveAssigneeDraft = isDraftForCurrentTask ? (assigneeDraft ?? "") : (task?.assigneeId ?? "");
  const effectiveProjectDraft = isDraftForCurrentTask ? (projectDraft ?? "") : (task?.projectId ?? "");

  const assigneeOptions = useMemo<Option[]>(() => {
    const selectedTeam = (teamsQuery.data ?? []).find((team) => team.id === task?.assignedTeamId);
    if (!selectedTeam) return [];

    const scoped = new Map<string, Option>();
    selectedTeam.members.forEach((member) => {
      if (!member.employeeId || scoped.has(member.employeeId)) return;
      scoped.set(member.employeeId, {
        id: member.employeeId,
        label: member.name?.trim() || member.email?.trim() || member.employeeId,
      });
    });
    return Array.from(scoped.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [task?.assignedTeamId, teamsQuery.data]);

  const projectOptions = useMemo<Option[]>(() => {
    const projects = projectsQuery.data ?? [];
    return projects.map((project) => ({ id: project.id, label: project.name }));
  }, [projectsQuery.data]);

  const viewerTeamRoles = useMemo(
    () => resolveViewerTeamRoles(
      teamsQuery.data ?? [],
      {
        employeeId: viewerIdentity?.employeeId ?? user?.id,
        email: viewerIdentity?.email ?? user?.email,
      },
      task?.assignedTeamId ? [task.assignedTeamId] : undefined
    ),
    [task?.assignedTeamId, teamsQuery.data, user?.email, user?.id, viewerIdentity?.email, viewerIdentity?.employeeId]
  );

  const canAssignTask = hasPermission(PERMISSIONS.TASKS_ASSIGN, { teamRoles: viewerTeamRoles });
  const canManageAssignee = canManageTasks || canAssignTask;

  const loading = taskQuery.isLoading;
  const loadingComments = commentsQuery.isLoading;
  const addingComment = addCommentMutation.isPending;
  const updatingTask = updateStatusMutation.isPending
    || updatePriorityMutation.isPending
    || updateDueDateMutation.isPending
    || updateAssigneeMutation.isPending
    || updateTaskMutation.isPending;

  const resolvedError = !id
    ? "Invalid task id."
    : (taskQuery.error ? getErrorMessage(taskQuery.error, "Unable to load task details.") : null);

  const commentsError = commentsQuery.error
    ? getErrorMessage(commentsQuery.error, "Unable to load comments.")
    : null;

  const canViewTask = Boolean(task);
  const canEditTaskTeam = hasTeamWorkflowAccess(viewerTeamRoles);

  const canUpdateStatus = useMemo(() => {
    if (!task) return false;
    if (canManageTasks) return true;
    if (!isEmployeeOnly) return false;
    if (task.assignedTeamId) return canEditTaskTeam;
    return isTaskAssignedToViewer(task, viewerIdentity);
  }, [canEditTaskTeam, canManageTasks, isEmployeeOnly, task, viewerIdentity]);
  const workflowPermissionNote = useMemo(() => {
    if (canManageTasks) return null;
    if (canManageAssignee) return "You don't have permission to edit protected fields outside task assignment.";
    if (canUpdateStatus) return "You don't have permission to edit assignment, scheduling, or priority.";
    return "You don't have permission to update this task.";
  }, [canManageAssignee, canManageTasks, canUpdateStatus]);

  const statusOptions = useMemo(() => {
    if (!task) return TASK_STATUS_OPTIONS;
    return getTaskAllowedStatuses(
      task,
      canManageTasks ? "TENANT_ADMIN" : role,
      task.assignedTeamId ? viewerTeamRoles : [],
      isTaskAssignedToViewer(task, viewerIdentity)
    );
  }, [canManageTasks, role, task, viewerIdentity, viewerTeamRoles]);

  const activityItems = useMemo<Array<{ id: string; label: string; at: string; detail?: string }>>(() => {
    if (!task) return [];

    const baseItems = [
      { id: `created-${task.id}`, label: "Task created", at: task.createdAt },
      { id: `updated-${task.id}`, label: "Task updated", at: task.updatedAt },
    ];

    const commentItems = comments.map((comment) => ({
      id: `comment-${comment.id}`,
      label: `${comment.authorName} commented`,
      detail: comment.comment,
      at: comment.createdAt,
    }));

    return [...baseItems, ...commentItems].sort((left, right) => right.at.localeCompare(left.at));
  }, [comments, task]);

  async function handleStatusChange(nextStatus: TaskStatus) {
    if (!task || !canUpdateStatus || nextStatus === task.status) return;

    try {
      const updated = await updateStatusMutation.mutateAsync(nextStatus);
      setDraftTaskId(updated.id);
      setDueDateDraft(updated.dueDate ?? "");
      setAssigneeDraft(updated.assigneeId ?? "");
      setProjectDraft(updated.projectId ?? "");
      toast.success({ title: "Task status updated" });
    } catch (err: unknown) {
      toast.error({
        title: "Unable to update task status",
        description: getErrorMessage(err, "Unable to update task status."),
      });
    }
  }

  async function handlePriorityChange(nextPriority: TaskPriority) {
    if (!task || !canManageTasks || nextPriority === task.priority) return;

    try {
      const updated = await updatePriorityMutation.mutateAsync(nextPriority);
      setDraftTaskId(updated.id);
      setDueDateDraft(updated.dueDate ?? "");
      setAssigneeDraft(updated.assigneeId ?? "");
      setProjectDraft(updated.projectId ?? "");
      toast.success({ title: "Task priority updated" });
    } catch (err: unknown) {
      toast.error({
        title: "Unable to update task priority",
        description: getErrorMessage(err, "Unable to update task priority."),
      });
    }
  }

  async function handleDueDateUpdate() {
    if (!task || !canManageTasks || !effectiveDueDateDraft || effectiveDueDateDraft === task.dueDate) return;

    try {
      const updated = await updateDueDateMutation.mutateAsync(effectiveDueDateDraft);
      setDraftTaskId(updated.id);
      setDueDateDraft(updated.dueDate ?? "");
      setAssigneeDraft(updated.assigneeId ?? "");
      setProjectDraft(updated.projectId ?? "");
      toast.success({ title: "Task due date updated" });
    } catch (err: unknown) {
      toast.error({
        title: "Unable to update due date",
        description: getErrorMessage(err, "Unable to update task due date."),
      });
    }
  }

  async function handleAssigneeUpdate() {
    if (!task || !canManageAssignee || effectiveAssigneeDraft === (task.assigneeId ?? "")) return;

    try {
      const updated = await updateAssigneeMutation.mutateAsync(effectiveAssigneeDraft);
      setDraftTaskId(updated.id);
      setDueDateDraft(updated.dueDate ?? "");
      setAssigneeDraft(updated.assigneeId ?? "");
      setProjectDraft(updated.projectId ?? "");
      toast.success({ title: "Task assignee updated" });
    } catch (err: unknown) {
      toast.error({
        title: "Unable to update assignee",
        description: getErrorMessage(err, "Unable to update task assignee."),
      });
    }
  }

  async function handleProjectUpdate() {
    if (!task || !canManageTasks || effectiveProjectDraft === (task.projectId ?? "")) return;

    try {
      const updated = await updateTaskMutation.mutateAsync({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        assigneeName: task.assigneeName,
        projectId: effectiveProjectDraft || undefined,
        projectName: projectOptions.find((project) => project.id === effectiveProjectDraft)?.label,
        attachments: task.attachments,
      });
      setDraftTaskId(updated.id);
      setDueDateDraft(updated.dueDate ?? "");
      setAssigneeDraft(updated.assigneeId ?? "");
      setProjectDraft(updated.projectId ?? "");
      toast.success({ title: "Task project updated" });
    } catch (err: unknown) {
      toast.error({
        title: "Unable to update project",
        description: getErrorMessage(err, "Unable to update task project."),
      });
    }
  }

  async function handleCommentSubmit() {
    if (!task || !canViewTask || !commentDraft.trim()) return;

    try {
      await addCommentMutation.mutateAsync(commentDraft.trim());
      setCommentDraft("");
      toast.success({ title: "Comment added" });
    } catch (err: unknown) {
      toast.error({
        title: "Unable to add comment",
        description: getErrorMessage(err, "Unable to add comment."),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" to="/app/tasks">
          <ArrowLeft size={16} />
          Back
        </Button>
        {task && canManageTasks ? <Button variant="outline" to={`/app/tasks/${task.id}/edit`}>Edit Task</Button> : null}
      </div>

      {loading ? (
        <SectionCard>
          <LoadingSkeleton lines={12} className="py-6" />
        </SectionCard>
      ) : null}

      {!loading && resolvedError ? (
        <ErrorState message={resolvedError} onRetry={() => void taskQuery.refetch()} />
      ) : null}

      {!loading && !resolvedError && !task ? (
        <EmptyState
          title="Task not found"
          description="The requested task does not exist."
          action={<Button variant="outline" to="/app/tasks">Go to Tasks</Button>}
        />
      ) : null}

      {!loading && !resolvedError && task && canViewTask ? (
        <>
          <SectionCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {task.title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {task.description || "No description provided."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <InfoCard icon={<UserCircle2 size={16} />} label="Assignee" value={task.assignedTeamName || task.assigneeName || "Unassigned"} />
            <InfoCard icon={<UserCircle2 size={16} />} label="Assigned Team" value={task.assignedTeamName || "Unscoped"} />
            <InfoCard icon={<FolderKanban size={16} />} label="Project" value={task.projectName || "No project"} />
            <InfoCard icon={<CalendarClock size={16} />} label="Due Date" value={formatDate(task.dueDate, "Not set")} />
          </div>

          <SectionCard title="Workflow Controls" subtitle="Manage task lifecycle with role-appropriate actions.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FieldSelect
                id="task-detail-status"
                label="Status"
                value={task.status}
                options={statusOptions}
                disabled={updatingTask || !canUpdateStatus}
                onChange={(value) => void handleStatusChange(value as TaskStatus)}
              />
              <FieldSelect
                id="task-detail-priority"
                label="Priority"
                value={task.priority}
                options={TASK_PRIORITY_OPTIONS}
                disabled={updatingTask || !canManageTasks}
                onChange={(value) => void handlePriorityChange(value as TaskPriority)}
              />
              <div className="space-y-1.5">
                <label htmlFor="task-detail-due-date" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  Due Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="task-detail-due-date"
                    type="date"
                    value={effectiveDueDateDraft}
                    onChange={(event) => {
                      setDraftTaskId(task.id);
                      setDueDateDraft(event.target.value);
                    }}
                    disabled={!canManageTasks}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-60"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
                  />
                  <Button size="sm" variant="outline" disabled={updatingTask || !canManageTasks || effectiveDueDateDraft === task.dueDate} onClick={() => void handleDueDateUpdate()}>
                    Save
                  </Button>
                </div>
              </div>
            </div>

            {canManageTasks || canManageAssignee ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="task-detail-assignee" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Assignee
                  </label>
                  <div className="flex items-center gap-2">
                    <AppSelect
                      id="task-detail-assignee"
                      value={effectiveAssigneeDraft}
                      onChange={(event) => {
                        setDraftTaskId(task.id);
                        setAssigneeDraft(event.target.value);
                      }}
                      disabled={!canManageAssignee}
                    >
                      <option value="">Unassigned</option>
                      {assigneeOptions.map((assignee) => (
                        <option key={assignee.id} value={assignee.id}>
                          {assignee.label}
                        </option>
                      ))}
                    </AppSelect>
                    <Button size="sm" variant="outline" disabled={updatingTask || !canManageAssignee || effectiveAssigneeDraft === (task.assigneeId ?? "")} onClick={() => void handleAssigneeUpdate()}>
                      Save
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="task-detail-project" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Project
                  </label>
                  <div className="flex items-center gap-2">
                    <AppSelect
                      id="task-detail-project"
                      value={effectiveProjectDraft}
                      onChange={(event) => {
                        setDraftTaskId(task.id);
                        setProjectDraft(event.target.value);
                      }}
                      disabled={!canManageTasks}
                    >
                      <option value="">No project</option>
                      {projectOptions.map((projectOption) => (
                        <option key={projectOption.id} value={projectOption.id}>
                          {projectOption.label}
                        </option>
                      ))}
                    </AppSelect>
                    <Button size="sm" variant="outline" disabled={updatingTask || !canManageTasks || effectiveProjectDraft === (task.projectId ?? "")} onClick={() => void handleProjectUpdate()}>
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {workflowPermissionNote ? (
              <p className="mt-4 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                {workflowPermissionNote}
              </p>
            ) : null}
          </SectionCard>

          <SectionCard title="Comments" subtitle="Collaborate on task execution updates.">
            <div className="space-y-4">
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}>
                <textarea
                  rows={3}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  disabled={addingComment}
                  placeholder="Add implementation notes, blockers, or progress updates..."
                  className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Commenting as {user?.name ?? "Current user"}
                  </span>
                  <Button size="sm" variant="primary" disabled={addingComment || !commentDraft.trim()} onClick={() => void handleCommentSubmit()}>
                    {addingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>

              {commentsError ? (
                <ErrorState message={commentsError} onRetry={() => void commentsQuery.refetch()} />
              ) : null}

              {loadingComments ? (
                <div className="rounded-xl border border-dashed p-4" style={{ borderColor: "var(--border-default)" }}>
                  <LoadingSkeleton lines={3} />
                </div>
              ) : null}

              {!loadingComments && comments.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
                  <MessageSquareText size={18} className="mx-auto mb-2" />
                  No comments yet. Start the conversation.
                </div>
              ) : null}

              {!loadingComments && comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))}
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Attachments" subtitle="Supporting files linked to this task.">
            <FileAssetList
              items={task.attachments}
              emptyLabel="No task attachments uploaded yet."
            />
          </SectionCard>

          <SectionCard title="Activity" subtitle="Task lifecycle and collaboration timeline.">
            <div className="space-y-3">
              {activityItems.map((entry) => (
                <div key={entry.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {entry.label}
                  </p>
                  {entry.detail ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm" style={{ color: "var(--text-secondary)" }}>
                      {entry.detail}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {formatDateTime(entry.at, "Unknown")}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}

function FieldSelect({
  id,
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      <AppSelect
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {toReadableLabel(option)}
          </option>
        ))}
      </AppSelect>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
        <span style={{ color: "var(--color-primary-500)" }}>{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}

function CommentItem({ comment }: { comment: TaskComment }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border-default)" }}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {comment.authorName}
        </p>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {formatDateTime(comment.createdAt, "Unknown")}
        </span>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm" style={{ color: "var(--text-secondary)" }}>
        {comment.comment}
      </p>
    </div>
  );
}
