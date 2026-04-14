import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { FileUploadField } from "@/components/common/FileUploadField";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, type TaskFormErrors, type TaskFormValues } from "@/modules/tasks/types";

interface Option {
  id: string;
  label: string;
}

interface TaskFormProps {
  values: TaskFormValues;
  errors: TaskFormErrors;
  teams: Option[];
  assignees: Option[];
  projects: Option[];
  submitting: boolean;
  submitDisabled?: boolean;
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
  teams,
  assignees,
  projects,
  submitting,
  submitDisabled = false,
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
          <AppSelect
            id="task-status"
            value={values.status}
            onChange={(event) => onChange({ ...values, status: event.target.value as TaskFormValues["status"] })}
          >
            {TASK_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {toLabel(status)}
              </option>
            ))}
          </AppSelect>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-priority" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Priority
          </label>
          <AppSelect
            id="task-priority"
            value={values.priority}
            onChange={(event) => onChange({ ...values, priority: event.target.value as TaskFormValues["priority"] })}
          >
            {TASK_PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {toLabel(priority)}
              </option>
            ))}
          </AppSelect>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-assigned-team" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Assigned Team
          </label>
          <AppSelect
            id="task-assigned-team"
            value={values.assignedTeamId}
            onChange={(event) => onChange({ ...values, assignedTeamId: event.target.value, assigneeId: "" })}
            error={Boolean(errors.assignedTeamId)}
          >
            <option value="">Select team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.label}
              </option>
            ))}
          </AppSelect>
          {errors.assignedTeamId && <p className="text-xs text-red-500">{errors.assignedTeamId}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-assignee" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Assignee (Optional)
          </label>
          <AppSelect
            id="task-assignee"
            value={values.assigneeId}
            onChange={(event) => onChange({ ...values, assigneeId: event.target.value })}
            error={Boolean(errors.assigneeId)}
          >
            <option value="">Team-level task (no individual assignee)</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.label}
              </option>
            ))}
          </AppSelect>
          {errors.assigneeId && <p className="text-xs text-red-500">{errors.assigneeId}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-project" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Project
          </label>
          <AppSelect
            id="task-project"
            value={values.projectId}
            onChange={(event) => onChange({ ...values, projectId: event.target.value, assignedTeamId: "", assigneeId: "" })}
            error={Boolean(errors.projectId)}
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.label}
              </option>
            ))}
          </AppSelect>
          {errors.projectId && <p className="text-xs text-red-500">{errors.projectId}</p>}
        </div>
      </div>

      <FileUploadField
        id="task-attachments"
        label="Attachments"
        hint="Share screenshots, requirement notes, or supporting PDFs."
        folder="tasks/attachments"
        kind="document"
        multiple
        disabled={submitting}
        value={values.attachments}
        onChange={(attachments) => onChange({ ...values, attachments })}
      />

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting || submitDisabled}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
