import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { FileUploadField } from "@/components/common/FileUploadField";
import { TextareaField } from "@/components/common/TextareaField";
import type { ProjectFormErrors, ProjectFormValues } from "@/modules/projects/types";
import type { Team } from "@/modules/teams/types";

interface ProjectFormProps {
  values: ProjectFormValues;
  errors: ProjectFormErrors;
  teams: Team[];
  submitting: boolean;
  canEditTeams?: boolean;
  submitLabel: string;
  onChange: (next: ProjectFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ProjectForm({
  values,
  errors,
  teams,
  submitting,
  canEditTeams = true,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  function toggleTeam(id: string) {
    const exists = values.teamIds.includes(id);
    const next = exists ? values.teamIds.filter((item) => item !== id) : [...values.teamIds, id];
    onChange({ ...values, teamIds: next });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          id="project-name"
          label="Project Name"
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          error={errors.name}
          placeholder="e.g. Payroll Integration"
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-status" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Status
          </label>
          <AppSelect
            id="project-status"
            value={values.status}
            onChange={(e) => onChange({ ...values, status: e.target.value as ProjectFormValues["status"] })}
          >
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </AppSelect>
        </div>
      </div>

      <TextareaField
        id="project-description"
        label="Description"
        rows={4}
        value={values.description}
        error={errors.description}
        onChange={(e) => onChange({ ...values, description: e.target.value })}
        placeholder="Describe project objective, scope, and delivery expectations."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          id="project-start-date"
          type="date"
          label="Start Date"
          value={values.startDate}
          onChange={(e) => onChange({ ...values, startDate: e.target.value })}
          error={errors.startDate}
        />
        <Input
          id="project-end-date"
          type="date"
          label="End Date"
          value={values.endDate}
          onChange={(e) => onChange({ ...values, endDate: e.target.value })}
          error={errors.endDate}
        />
      </div>

      <FileUploadField
        id="project-documents"
        label="Project Documents"
        hint="Upload project briefs, contracts, or design references."
        folder="projects/documents"
        kind="document"
        multiple
        disabled={submitting}
        value={values.documents}
        onChange={(documents) => onChange({ ...values, documents })}
      />

      <div>
        <div className="text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          Assigned Teams
        </div>
        <div
          className="max-h-52 overflow-y-auto rounded-xl border p-2"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
        >
          {!canEditTeams && (
            <p className="px-2 py-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Team assignment is restricted. You can update project details, but only workspace managers can change linked teams.
            </p>
          )}
          {teams.length === 0 && (
            <p className="px-2 py-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
              No teams available. Create a team first to assign it to this project.
            </p>
          )}
          {teams.map((team) => (
            <label
              key={team.id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm cursor-pointer hover:bg-primary-50/40 dark:hover:bg-primary-950/15"
              style={{ color: "var(--text-primary)" }}
            >
              <input
                type="checkbox"
                checked={values.teamIds.includes(team.id)}
                disabled={!canEditTeams}
                onChange={() => toggleTeam(team.id)}
              />
              <span className="truncate">{team.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting} loading={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
