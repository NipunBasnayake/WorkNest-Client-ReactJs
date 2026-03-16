import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getId, getString, toIsoDate, toIsoDateTime } from "@/services/http/parsers";
import { useAuthStore } from "@/store/authStore";
import type { Task, TaskComment, TaskPayload, TaskPriority, TaskStatus } from "@/modules/tasks/types";
import type { ApiResponse } from "@/types";

function toUiStatus(value: unknown): TaskStatus {
  const status = getString(value)?.toUpperCase();
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "IN_REVIEW" || status === "REVIEW") return "IN_REVIEW";
  if (status === "BLOCKED") return "BLOCKED";
  if (status === "DONE" || status === "COMPLETED") return "DONE";
  return "TODO";
}

function toUiPriority(value: unknown): TaskPriority {
  const priority = getString(value)?.toUpperCase();
  if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH" || priority === "CRITICAL") {
    return priority;
  }
  if (priority === "URGENT") return "CRITICAL";
  return "MEDIUM";
}

function normalizeTask(input: unknown): Task {
  const value = asRecord(input);

  return {
    id: getId(firstDefined(value.id, value.taskId)),
    title: firstDefined(getString(value.title), getString(value.name)) ?? "Untitled Task",
    description: firstDefined(getString(value.description), getString(value.details)),
    status: toUiStatus(firstDefined(value.status, value.taskStatus)),
    priority: toUiPriority(firstDefined(value.priority, value.taskPriority)),
    dueDate: toIsoDate(firstDefined(value.dueDate, value.dueOn)),
    assigneeId: firstDefined(
      getString(value.assigneeId),
      getString(asRecord(value.assignee).id),
      getString(asRecord(value.assignee).employeeId)
    ),
    assigneeName: firstDefined(
      getString(value.assigneeName),
      getString(asRecord(value.assignee).fullName),
      getString(asRecord(value.assignee).name)
    ),
    projectId: firstDefined(
      getString(value.projectId),
      getString(asRecord(value.project).id)
    ),
    projectName: firstDefined(
      getString(value.projectName),
      getString(asRecord(value.project).name)
    ),
    createdAt: toIsoDateTime(firstDefined(value.createdAt, value.createdDate)),
    updatedAt: toIsoDateTime(firstDefined(value.updatedAt, value.updatedDate, value.modifiedAt)),
  };
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

function toApiPayload(payload: TaskPayload, includeCreator: boolean): Record<string, unknown> {
  const creatorId = useAuthStore.getState().user?.id;
  const requestPayload: Record<string, unknown> = {
    title: payload.title.trim(),
    description: payload.description.trim() || undefined,
    status: payload.status,
    priority: payload.priority,
    assigneeId: payload.assigneeId || undefined,
    dueDate: payload.dueDate || undefined,
  };

  if (payload.projectId) {
    requestPayload.projectId = payload.projectId;
  }

  if (includeCreator && creatorId) {
    requestPayload.createdByEmployeeId = creatorId;
  }

  return requestPayload;
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

export async function getTaskById(id: string): Promise<Task> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(`/api/tenant/tasks/${id}`);
  return normalizeTask(unwrapApiData<unknown>(data));
}

export async function createTask(payload: TaskPayload): Promise<Task> {
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(
    "/api/tenant/tasks",
    toApiPayload(payload, true)
  );
  return normalizeTask(unwrapApiData<unknown>(data));
}

export async function updateTask(id: string, payload: TaskPayload): Promise<Task> {
  const { data } = await apiClient.put<ApiResponse<unknown> | unknown>(
    `/api/tenant/tasks/${id}`,
    toApiPayload(payload, false)
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
    { assigneeId: assigneeId || null }
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
  const authorId = useAuthStore.getState().user?.id;
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(`/api/tenant/tasks/${taskId}/comments`, {
    commentedByEmployeeId: authorId,
    comment: comment.trim(),
  });
  return normalizeTaskComment(unwrapApiData<unknown>(data));
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/api/tenant/tasks/${id}`);
}
