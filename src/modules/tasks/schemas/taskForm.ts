import type { TaskFormErrors, TaskFormValues } from "@/modules/tasks/types";

export const DEFAULT_TASK_FORM: TaskFormValues = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: "",
  assigneeId: "",
  projectId: "",
  attachments: [],
};

export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "Task title is required.";
  }

  if (!values.description.trim()) {
    errors.description = "Task description is required.";
  }

  if (!values.dueDate) {
    errors.dueDate = "Due date is required.";
  }

  if (!values.assigneeId.trim()) {
    errors.assigneeId = "Assignee is required.";
  }

  if (!values.projectId.trim()) {
    errors.projectId = "Project is required.";
  }

  if (values.description.trim().length > 1500) {
    errors.description = "Description cannot exceed 1500 characters.";
  }

  return errors;
}
