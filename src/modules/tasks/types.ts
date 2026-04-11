import type { UploadedFileAsset } from "@/types";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const TASK_STATUS_OPTIONS: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"];
export const TASK_PRIORITY_OPTIONS: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId?: string;
  assigneeEmployeeId?: string;
  assigneeUserId?: string;
  assigneeEmail?: string;
  assigneeName?: string;
  projectId?: string;
  projectName?: string;
  attachments: UploadedFileAsset[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskPayload {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId?: string;
  assigneeName?: string;
  projectId?: string;
  projectName?: string;
  attachments: UploadedFileAsset[];
}

export interface TaskCreateRequest {
  projectId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  attachmentUrls?: string[];
}

export interface TaskUpdateRequest {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  attachmentUrls?: string[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  comment: string;
  createdAt: string;
  authorId: string;
  authorName: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
  projectId: string;
  attachments: UploadedFileAsset[];
}

export type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>;
