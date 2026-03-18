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
  function toggleMember(id: string) {
    if (id === values.managerEmployeeId) return;
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="team-manager-employee" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Manager (Select Employee)
        </label>
        <select
          id="team-manager-employee"
          value={values.managerEmployeeId}
          onChange={(e) => {
            const managerEmployeeId = e.target.value;
            onChange({
              ...values,
              managerEmployeeId,
              memberIds: managerEmployeeId
                ? Array.from(new Set([...values.memberIds, managerEmployeeId]))
                : values.memberIds.filter((memberId) => memberId !== values.managerEmployeeId),
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
        {errors.managerEmployeeId && (
          <p className="text-xs text-red-500">{errors.managerEmployeeId}</p>
        )}
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          The selected manager is auto-included in team members.
        </p>
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
            <div
              key={emp.id}
              className="flex items-center justify-between gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-primary-50/40 dark:hover:bg-primary-950/15"
              style={{ color: "var(--text-primary)" }}
            >
              <label className="flex min-w-0 cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={values.memberIds.includes(emp.id)}
                  disabled={values.managerEmployeeId === emp.id}
                  onChange={() => toggleMember(emp.id)}
                />
                <span className="truncate">{emp.name}</span>
              </label>
              {values.managerEmployeeId === emp.id && (
                <span
                  className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: "rgba(147,50,234,0.12)", color: "var(--color-primary-600)" }}
                >
                  Manager
                </span>
              )}
            </div>
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
