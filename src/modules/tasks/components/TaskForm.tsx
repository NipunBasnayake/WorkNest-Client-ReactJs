import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, type TaskFormErrors, type TaskFormValues } from "@/modules/tasks/types";

interface Option {
  id: string;
  label: string;
}

interface TaskFormProps {
  values: TaskFormValues;
  errors: TaskFormErrors;
  assignees: Option[];
  projects: Option[];
  submitting: boolean;
  submitLabel: string;
  onChange: (next: TaskFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function toLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function TaskForm({
  values,
  errors,
  assignees,
  projects,
  submitting,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Input
        id="task-title"
        label="Task Title"
        value={values.title}
        error={errors.title}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
        placeholder="e.g. Prepare sprint planning deck"
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="task-description" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Description
        </label>
        <textarea
          id="task-description"
          rows={4}
          value={values.description}
          onChange={(event) => onChange({ ...values, description: event.target.value })}
          className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: errors.description ? "rgba(239,68,68,0.4)" : "var(--border-default)",
            color: "var(--text-primary)",
          }}
          placeholder="Provide implementation notes, acceptance criteria, or dependencies."
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-status" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Status
          </label>
          <select
            id="task-status"
            value={values.status}
            onChange={(event) => onChange({ ...values, status: event.target.value as TaskFormValues["status"] })}
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          >
            {TASK_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {toLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-priority" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Priority
          </label>
          <select
            id="task-priority"
            value={values.priority}
            onChange={(event) => onChange({ ...values, priority: event.target.value as TaskFormValues["priority"] })}
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          >
            {TASK_PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {toLabel(priority)}
              </option>
            ))}
          </select>
        </div>

        <Input
          id="task-due-date"
          type="date"
          label="Due Date"
          value={values.dueDate}
          error={errors.dueDate}
          onChange={(event) => onChange({ ...values, dueDate: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-assignee" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Assignee
          </label>
          <select
            id="task-assignee"
            value={values.assigneeId}
            onChange={(event) => onChange({ ...values, assigneeId: event.target.value })}
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: errors.assigneeId ? "rgba(239,68,68,0.4)" : "var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">Select assignee</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.label}
              </option>
            ))}
          </select>
          {errors.assigneeId && <p className="text-xs text-red-500">{errors.assigneeId}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-project" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Project
          </label>
          <select
            id="task-project"
            value={values.projectId}
            onChange={(event) => onChange({ ...values, projectId: event.target.value })}
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: errors.projectId ? "rgba(239,68,68,0.4)" : "var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </select>
          {errors.projectId && <p className="text-xs text-red-500">{errors.projectId}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
