import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { TextareaField } from "@/components/common/TextareaField";
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

      <TextareaField
        id="announcement-content"
        label="Content"
        rows={8}
        value={values.content}
        error={errors.content}
        onChange={(event) => onChange({ ...values, content: event.target.value })}
        placeholder="Write the announcement message for your workspace."
      />

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
        <Button type="submit" variant="primary" disabled={submitting} loading={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
