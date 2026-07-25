import { Button } from "@/components/common/Button";
import { FileUploadField } from "@/components/common/FileUploadField";
import { Input } from "@/components/common/Input";
import { AppSelect } from "@/components/common/AppSelect";
import { TextareaField } from "@/components/common/TextareaField";
import type {
  AnnouncementFormErrors,
  AnnouncementFormValues,
} from "@/modules/announcements/types";

interface SelectOption {
  value: string;
  label: string;
}

interface AnnouncementFormProps {
  values: AnnouncementFormValues;
  errors: AnnouncementFormErrors;
  submitting: boolean;
  submitLabel: string;
  teamOptions?: SelectOption[];
  onChange: (next: AnnouncementFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function AnnouncementForm({
  values,
  errors,
  submitting,
  submitLabel,
  teamOptions = [],
  onChange,
  onSubmit,
  onCancel,
}: AnnouncementFormProps) {
  return (
    <form
      className="space-y-5"
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
        maxLength={200}
        onChange={(event) =>
          onChange({ ...values, title: event.target.value })
        }
        placeholder="e.g. Company all-hands on Friday"
      />
      <p
        className="-mt-4 text-right text-xs"
        style={{ color: "var(--text-tertiary)" }}
      >
        {values.title.length}/200
      </p>

      <TextareaField
        id="announcement-content"
        label="Content"
        rows={10}
        value={values.content}
        error={errors.content}
        maxLength={5000}
        onChange={(event) =>
          onChange({ ...values, content: event.target.value })
        }
        placeholder="Write the announcement message for your workspace."
      />
      <p
        className="-mt-4 text-right text-xs"
        style={{ color: "var(--text-tertiary)" }}
      >
        {values.content.length}/5,000
      </p>

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
          Audience
        </span>
        <AppSelect
          value={values.teamId}
          onChange={(event) =>
            onChange({ ...values, teamId: event.target.value })
          }
        >
          <option value="">All employees</option>
          {teamOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AppSelect>
      </label>

      <label
        className="inline-flex cursor-pointer items-center gap-2 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        <input
          type="checkbox"
          checked={values.pinned}
          onChange={(event) =>
            onChange({ ...values, pinned: event.target.checked })
          }
        />
        Pin this announcement at the top of the feed.
      </label>

      <FileUploadField
        id="announcement-attachments"
        label="Attachments"
        hint="Attach supporting documents or images to this announcement."
        folder="announcements/attachments"
        category="ANNOUNCEMENT_ATTACHMENT"
        kind="document"
        multiple
        disabled={submitting}
        value={values.attachments}
        onChange={(attachments) => onChange({ ...values, attachments })}
      />

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={submitting}
          loading={submitting}
        >
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
