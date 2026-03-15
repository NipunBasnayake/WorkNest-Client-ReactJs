export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "BLOCKED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export const TASK_STATUS_OPTIONS: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED", "BLOCKED"];
export const TASK_PRIORITY_OPTIONS: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId?: string;
  assigneeName?: string;
  projectId?: string;
  projectName?: string;
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
}

export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
  projectId: string;
}

export type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>;
