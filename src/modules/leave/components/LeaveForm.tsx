import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { FileUploadField } from "@/components/common/FileUploadField";
import { LEAVE_TYPE_OPTIONS, type LeaveFormErrors, type LeaveFormValues } from "@/modules/leave/types";

interface LeaveFormProps {
  values: LeaveFormValues;
  errors: LeaveFormErrors;
  submitting: boolean;
  submitLabel: string;
  onChange: (next: LeaveFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function LeaveForm({ values, errors, submitting, submitLabel, onChange, onSubmit, onCancel }: LeaveFormProps) {
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="leave-type" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Leave Type
          </label>
          <AppSelect
            id="leave-type"
            value={values.leaveType}
            onChange={(event) => onChange({ ...values, leaveType: event.target.value as LeaveFormValues["leaveType"] })}
          >
            {LEAVE_TYPE_OPTIONS.map((leaveType) => (
              <option key={leaveType} value={leaveType}>
                {leaveType.charAt(0) + leaveType.slice(1).toLowerCase()}
              </option>
            ))}
          </AppSelect>
        </div>

        <Input
          id="leave-start-date"
          type="date"
          label="Start Date"
          value={values.startDate}
          error={errors.startDate}
          onChange={(event) => onChange({ ...values, startDate: event.target.value })}
        />

        <Input
          id="leave-end-date"
          type="date"
          label="End Date"
          value={values.endDate}
          error={errors.endDate}
          onChange={(event) => onChange({ ...values, endDate: event.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="leave-reason" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Reason
        </label>
        <textarea
          id="leave-reason"
          rows={5}
          value={values.reason}
          onChange={(event) => onChange({ ...values, reason: event.target.value })}
          className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: errors.reason ? "rgba(239,68,68,0.4)" : "var(--border-default)",
            color: "var(--text-primary)",
          }}
          placeholder="Briefly explain the leave request."
        />
        {errors.reason && <p className="text-xs text-red-500">{errors.reason}</p>}
      </div>

      <FileUploadField
        id="leave-attachments"
        label="Supporting Documents"
        hint="Attach medical notes or supporting documents when needed."
        folder="leave/attachments"
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
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
