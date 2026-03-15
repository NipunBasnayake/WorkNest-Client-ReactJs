import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import type { AnnouncementFormErrors, AnnouncementFormValues } from "@/modules/announcements/types";

interface AnnouncementFormProps {
  values: AnnouncementFormValues;
  errors: AnnouncementFormErrors;
  submitting: boolean;
  submitLabel: string;
  onChange: (next: AnnouncementFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function AnnouncementForm({
  values,
  errors,
  submitting,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: AnnouncementFormProps) {
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
        id="announcement-title"
        label="Title"
        value={values.title}
        error={errors.title}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
        placeholder="e.g. Company all-hands on Friday"
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="announcement-content" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Content
        </label>
        <textarea
          id="announcement-content"
          rows={8}
          value={values.content}
          onChange={(event) => onChange({ ...values, content: event.target.value })}
          className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/60"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: errors.content ? "rgba(239,68,68,0.4)" : "var(--border-default)",
            color: "var(--text-primary)",
          }}
          placeholder="Write the announcement message for your workspace."
        />
        {errors.content && <p className="text-xs text-red-500">{errors.content}</p>}
      </div>

      <label className="inline-flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}>
        <input
          type="checkbox"
          checked={values.pinned}
          onChange={(event) => onChange({ ...values, pinned: event.target.checked })}
        />
        Pin this announcement at the top of the feed.
      </label>

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
