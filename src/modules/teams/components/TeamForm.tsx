import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import type { TeamFormErrors, TeamFormValues } from "@/modules/teams/types";

interface EmployeeOption {
  id: string;
  name: string;
}

interface TeamFormProps {
  values: TeamFormValues;
  errors: TeamFormErrors;
  employeeOptions: EmployeeOption[];
  submitting: boolean;
  submitLabel: string;
  onChange: (next: TeamFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function TeamForm({
  values,
  errors,
  employeeOptions,
  submitting,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: TeamFormProps) {
  const selectedManager = employeeOptions.find((opt) => opt.id === values.managerEmployeeId);

  function toggleMember(id: string) {
    const exists = values.memberIds.includes(id);
    const next = exists
      ? values.memberIds.filter((item) => item !== id)
      : [...values.memberIds, id];

    onChange({ ...values, memberIds: next });
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
          id="team-name"
          label="Team Name"
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          error={errors.name}
          placeholder="e.g. Product Engineering"
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="team-status" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Status
          </label>
          <select
            id="team-status"
            value={values.status}
            onChange={(e) => onChange({ ...values, status: e.target.value as TeamFormValues["status"] })}
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          >
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="team-description" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Description
        </label>
        <textarea
          id="team-description"
          rows={3}
          value={values.description}
          onChange={(e) => onChange({ ...values, description: e.target.value })}
          className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          placeholder="Brief summary of team purpose and responsibilities."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="team-manager-employee" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Manager (Select Employee)
          </label>
          <select
            id="team-manager-employee"
            value={values.managerEmployeeId}
            onChange={(e) => {
              const managerEmployeeId = e.target.value;
              const manager = employeeOptions.find((opt) => opt.id === managerEmployeeId);
              onChange({
                ...values,
                managerEmployeeId,
                managerName: manager?.name ?? values.managerName,
              });
            }}
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          >
            <option value="">Select manager</option>
            {employeeOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </div>

        <Input
          id="team-manager-name"
          label="Manager Name"
          value={selectedManager?.name ?? values.managerName}
          onChange={(e) => onChange({ ...values, managerName: e.target.value })}
          error={errors.managerName}
          placeholder="e.g. Asha Fernando"
        />
      </div>

      <div>
        <div className="text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          Team Members
        </div>
        <div
          className="max-h-56 overflow-y-auto rounded-xl border p-2"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: errors.memberIds ? "rgba(239,68,68,0.4)" : "var(--border-default)" }}
        >
          {employeeOptions.length === 0 && (
            <p className="px-2 py-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Employee options are unavailable right now.
            </p>
          )}
          {employeeOptions.map((emp) => (
            <label
              key={emp.id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm cursor-pointer hover:bg-primary-50/40 dark:hover:bg-primary-950/15"
              style={{ color: "var(--text-primary)" }}
            >
              <input
                type="checkbox"
                checked={values.memberIds.includes(emp.id)}
                onChange={() => toggleMember(emp.id)}
              />
              <span className="truncate">{emp.name}</span>
            </label>
          ))}
        </div>
        {errors.memberIds && (
          <p className="mt-1 text-xs text-red-500">{errors.memberIds}</p>
        )}
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
