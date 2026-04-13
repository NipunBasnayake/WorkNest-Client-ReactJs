import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getId, getString, toIsoDate, toIsoDateTime } from "@/services/http/parsers";
import { extractUploadedFileAssets } from "@/services/uploads/fileAssetParser";
import { useAuthStore } from "@/store/authStore";
import { getMyEmployeeProfile } from "@/modules/employees/services/employeeService";
import { TASK_PRIORITY_VALUES, TASK_STATUS_VALUES } from "@/constants/apiEnums";
import type {
  Task,
  TaskComment,
  TaskCreateRequest,
  TaskPayload,
  TaskPriority,
  TaskStatus,
  TaskUpdateRequest,
} from "@/modules/tasks/types";
import type { ApiResponse } from "@/types";

export interface TaskViewerIdentity {
  employeeId?: string;
  userId?: string;
  email?: string;
}

function toUiStatus(value: unknown): TaskStatus {
  const status = getString(value)?.toUpperCase();
  if (status && TASK_STATUS_VALUES.includes(status as typeof TASK_STATUS_VALUES[number])) {
    return status as TaskStatus;
  }
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "IN_REVIEW" || status === "REVIEW") return "IN_REVIEW";
  if (status === "BLOCKED") return "BLOCKED";
  if (status === "DONE" || status === "COMPLETED") return "DONE";
  return "TODO";
}

function toUiPriority(value: unknown): TaskPriority {
  const priority = getString(value)?.toUpperCase();
  if (priority && TASK_PRIORITY_VALUES.includes(priority as typeof TASK_PRIORITY_VALUES[number])) {
    return priority as TaskPriority;
  }
  if (priority === "URGENT") return "CRITICAL";
  return "MEDIUM";
}

function normalizeEmail(value: unknown): string | undefined {
  const email = getString(value);
  return email ? email.toLowerCase() : undefined;
}

function resolveAssigneeFields(value: Record<string, unknown>) {
  const assignee = asRecord(firstDefined(value.assignee, value.assignedTo, value.owner, value.employee));
  const assigneeEmployee = asRecord(firstDefined(assignee.employee, assignee.employeeProfile));
  const assigneeUser = asRecord(firstDefined(assignee.user, assignee.account, assignee.userProfile));
  const assigneeFirstName = firstDefined(getString(assignee.firstName), getString(assignee.first_name));
  const assigneeLastName = firstDefined(getString(assignee.lastName), getString(assignee.last_name));
  const derivedAssigneeName = `${assigneeFirstName ?? ""} ${assigneeLastName ?? ""}`.trim();

  const assigneeEmployeeId = firstDefined(
    getString(value.assigneeEmployeeId),
    getString(value.assignedEmployeeId),
    getString(value.assignedToEmployeeId),
    getString(assignee.employeeId),
    getString(assigneeEmployee.employeeId),
    getString(assigneeEmployee.id),
    getString(asRecord(assigneeUser.employee).employeeId),
    getString(asRecord(assigneeUser.employee).id),
  );

  const assigneeUserId = firstDefined(
    getString(value.assigneeUserId),
    getString(value.assignedUserId),
    getString(value.assignedToUserId),
    getString(assignee.userId),
    getString(assigneeUser.userId),
    getString(assigneeUser.id),
    getString(assignee.id),
  );

  return {
    assigneeEmployeeId,
    assigneeUserId,
    assigneeId: firstDefined(
      assigneeEmployeeId,
      getString(value.assigneeId),
      assigneeUserId
    ),
    assigneeEmail: firstDefined(
      normalizeEmail(value.assigneeEmail),
      normalizeEmail(assignee.email),
      normalizeEmail(assigneeUser.email),
      normalizeEmail(assigneeEmployee.email)
    ),
    assigneeName: firstDefined(
      getString(value.assigneeName),
      getString(value.assignedToName),
      getString(assignee.fullName),
      getString(assignee.name),
      derivedAssigneeName || undefined,
      getString(assignee.email),
      getString(assigneeUser.email),
      getString(assigneeEmployee.email)
    ),
  };
}

function normalizeTask(input: unknown): Task {
  const value = asRecord(input);
  const {
    assigneeId,
    assigneeEmployeeId,
    assigneeUserId,
    assigneeEmail,
    assigneeName,
  } = resolveAssigneeFields(value);

  return {
    id: getId(firstDefined(value.id, value.taskId)),
    title: firstDefined(getString(value.title), getString(value.name)) ?? "Untitled Task",
    description: firstDefined(getString(value.description), getString(value.details)),
    status: toUiStatus(firstDefined(value.status, value.taskStatus)),
    priority: toUiPriority(firstDefined(value.priority, value.taskPriority)),
    dueDate: toIsoDate(firstDefined(value.dueDate, value.dueOn)),
    assignedTeamId: firstDefined(
      getString(value.assignedTeamId),
      getString(value.teamId),
      getString(asRecord(value.assignedTeam).id),
      getString(asRecord(value.team).id)
    ),
    assignedTeamName: firstDefined(
      getString(value.assignedTeamName),
      getString(value.teamName),
      getString(asRecord(value.assignedTeam).name),
      getString(asRecord(value.team).name)
    ),
    assignedEmployeeId: firstDefined(
      getString(value.assignedEmployeeId),
      assigneeEmployeeId,
      getString(value.assigneeId)
    ),
    assigneeId,
    assigneeEmployeeId,
    assigneeUserId,
    assigneeEmail,
    assigneeName,
    createdByEmployeeId: firstDefined(
      getString(value.createdByEmployeeId),
      getString(asRecord(value.createdBy).id)
    ),
    createdByUserId: getString(value.createdByUserId),
    assignedByEmployeeId: firstDefined(
      getString(value.assignedByEmployeeId),
      getString(asRecord(value.assignedBy).id)
    ),
    assignedByUserId: getString(value.assignedByUserId),
    projectId: firstDefined(
      getString(value.projectId),
      getString(asRecord(value.project).id)
    ),
    projectName: firstDefined(
      getString(value.projectName),
      getString(asRecord(value.project).name)
    ),
    attachments: extractUploadedFileAssets(
      firstDefined(value.attachments, value.files),
      firstDefined(value.attachmentUrls, value.fileUrls)
    ),
    createdAt: toIsoDateTime(firstDefined(value.createdAt, value.createdDate)),
    updatedAt: toIsoDateTime(firstDefined(value.updatedAt, value.updatedDate, value.modifiedAt)),
  };
}

export function normalizeTaskFromUnknown(input: unknown): Task {
  return normalizeTask(input);
}

function normalizedIdentityIds(identity: TaskViewerIdentity | null | undefined): string[] {
  if (!identity) return [];
  const seen = new Set<string>();
  const values = [identity.employeeId, identity.userId];
  for (const value of values) {
    const id = getString(value);
    if (!id) continue;
    seen.add(id);
  }
  return Array.from(seen);
}

export async function resolveTaskViewerIdentity(): Promise<TaskViewerIdentity> {
  const authUser = useAuthStore.getState().user;
  const baseIdentity: TaskViewerIdentity = {
    userId: getString(authUser?.id) || undefined,
    email: normalizeEmail(authUser?.email),
  };

  try {
    const profile = await getMyEmployeeProfile();
    const profileValue = asRecord(profile);
    const profileUser = asRecord(firstDefined(profileValue.user, profileValue.account, profileValue.userProfile));
    const profileEmployee = asRecord(firstDefined(profileValue.employee, profileValue.employeeProfile));

    const employeeId = firstDefined(
      getString(profile.id),
      getString(profileValue.employeeId),
      getString(profileEmployee.id),
      getString(profileEmployee.employeeId),
    );

    const userId = firstDefined(
      getString(profileValue.userId),
      getString(profileUser.id),
      getString(profileUser.userId),
      baseIdentity.userId
    );

    const email = firstDefined(
      normalizeEmail(profile.email),
      normalizeEmail(profileValue.email),
      normalizeEmail(profileUser.email),
      baseIdentity.email
    );

    return {
      employeeId: employeeId || undefined,
      userId: userId || undefined,
      email,
    };
  } catch {
    return baseIdentity;
  }
}

export function hasTaskViewerIdentity(identity: TaskViewerIdentity | null | undefined): boolean {
  if (!identity) return false;
  return Boolean(identity.employeeId || identity.userId || identity.email);
}

export function isTaskAssignedToViewer(task: Task, identity: TaskViewerIdentity | null | undefined): boolean {
  if (!identity) return false;

  const identityIds = normalizedIdentityIds(identity);
  const taskAssigneeIds = [task.assigneeEmployeeId, task.assigneeId, task.assigneeUserId]
    .map((value) => getString(value))
    .filter((value): value is string => Boolean(value));

  if (taskAssigneeIds.some((taskId) => identityIds.includes(taskId))) {
    return true;
  }

  const normalizedViewerEmail = normalizeEmail(identity.email);
  const normalizedTaskEmail = normalizeEmail(task.assigneeEmail);
  return Boolean(normalizedViewerEmail && normalizedTaskEmail && normalizedViewerEmail === normalizedTaskEmail);
}

export function filterTasksForViewer(tasks: Task[], identity: TaskViewerIdentity | null | undefined): Task[] {
  if (!hasTaskViewerIdentity(identity)) return [];
  return tasks.filter((task) => isTaskAssignedToViewer(task, identity));
}

function normalizeTaskComment(input: unknown): TaskComment {
  const value = asRecord(input);
  const author = asRecord(firstDefined(value.commentedBy, value.author));

  return {
    id: getId(firstDefined(value.id, value.commentId)),
    taskId: getId(firstDefined(value.taskId, asRecord(value.task).id)),
    comment: firstDefined(getString(value.comment), getString(value.message), getString(value.content)) ?? "",
    createdAt: toIsoDateTime(firstDefined(value.createdAt, value.createdDate)),
    authorId: getId(firstDefined(value.commentedByEmployeeId, value.authorId, author.id)),
    authorName: firstDefined(
      getString(value.authorName),
      getString(author.fullName),
      getString(author.name),
      getString(author.email)
    ) ?? "User",
  };
}

function buildTaskBasePayload(
  payload: TaskPayload
): Pick<TaskCreateRequest, "title" | "description" | "status" | "priority" | "assignedTeamId" | "assignedEmployeeId" | "assigneeId" | "dueDate" | "attachmentUrls"> {
  return {
    title: payload.title.trim(),
    description: payload.description.trim(),
    status: payload.status,
    priority: payload.priority,
    assignedTeamId: payload.assignedTeamId || undefined,
    assignedEmployeeId: payload.assignedEmployeeId || payload.assigneeId || undefined,
    assigneeId: payload.assigneeId || undefined,
    dueDate: payload.dueDate || undefined,
    attachmentUrls: payload.attachments.map((attachment) => attachment.url),
  };
}

async function toCreateApiPayload(payload: TaskPayload): Promise<TaskCreateRequest> {
  return {
    ...buildTaskBasePayload(payload),
    projectId: payload.projectId || undefined,
  };
}

function toUpdateApiPayload(payload: TaskPayload): TaskUpdateRequest {
  return buildTaskBasePayload(payload);
}

export async function getTasks(): Promise<Task[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/tasks/search", {
    params: { page: 0, size: 200, sortBy: "createdAt", sortDir: "desc" },
  });
  const list = extractList(unwrapApiData<unknown>(data));
  return list.map(normalizeTask).sort((a, b) => {
    const left = a.dueDate || "9999-12-31";
    const right = b.dueDate || "9999-12-31";
    return left.localeCompare(right);
  });
}

export async function getMyTasks(): Promise<Task[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/tasks/my");
  const list = extractList(unwrapApiData<unknown>(data));
  return list.map(normalizeTask).sort((a, b) => {
    const left = a.dueDate || "9999-12-31";
    const right = b.dueDate || "9999-12-31";
    return left.localeCompare(right);
  });
}

export async function getTaskById(id: string): Promise<Task> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(`/api/tenant/tasks/${id}`);
  return normalizeTask(unwrapApiData<unknown>(data));
}

export async function createTask(payload: TaskPayload): Promise<Task> {
  const apiPayload = await toCreateApiPayload(payload);
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(
    "/api/tenant/tasks",
    apiPayload
  );
  return normalizeTask(unwrapApiData<unknown>(data));
}

export async function updateTask(id: string, payload: TaskPayload): Promise<Task> {
  const apiPayload = toUpdateApiPayload(payload);
  const { data } = await apiClient.put<ApiResponse<unknown> | unknown>(
    `/api/tenant/tasks/${id}`,
    apiPayload
  );
  return normalizeTask(unwrapApiData<unknown>(data));
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const { data } = await apiClient.patch<ApiResponse<unknown> | unknown>(
    `/api/tenant/tasks/${id}/status`,
    { status }
  );
  return normalizeTask(unwrapApiData<unknown>(data));
}

export async function updateTaskPriority(id: string, priority: TaskPriority): Promise<Task> {
  const { data } = await apiClient.patch<ApiResponse<unknown> | unknown>(
    `/api/tenant/tasks/${id}/priority`,
    { priority }
  );
  return normalizeTask(unwrapApiData<unknown>(data));
}

export async function updateTaskDueDate(id: string, dueDate: string): Promise<Task> {
  const { data } = await apiClient.patch<ApiResponse<unknown> | unknown>(
    `/api/tenant/tasks/${id}/due-date`,
    { dueDate }
  );
  return normalizeTask(unwrapApiData<unknown>(data));
}

export async function updateTaskAssignee(id: string, assigneeId: string): Promise<Task> {
  const { data } = await apiClient.patch<ApiResponse<unknown> | unknown>(
    `/api/tenant/tasks/${id}/assignee`,
    { assignedEmployeeId: assigneeId || null, assigneeId: assigneeId || null }
  );
  return normalizeTask(unwrapApiData<unknown>(data));
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(`/api/tenant/tasks/${taskId}/comments`);
  return extractList(unwrapApiData<unknown>(data))
    .map(normalizeTaskComment)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addTaskComment(taskId: string, comment: string): Promise<TaskComment> {
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(`/api/tenant/tasks/${taskId}/comments`, {
    comment: comment.trim(),
  });
  return normalizeTaskComment(unwrapApiData<unknown>(data));
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/api/tenant/tasks/${id}`);
}
