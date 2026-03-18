import type { AnnouncementFormErrors, AnnouncementFormValues } from "@/modules/announcements/types";

export const DEFAULT_ANNOUNCEMENT_FORM: AnnouncementFormValues = {
  title: "",
  content: "",
  pinned: false,
};

export function validateAnnouncementForm(values: AnnouncementFormValues): AnnouncementFormErrors {
  const errors: AnnouncementFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "Announcement title is required.";
  }

  if (!values.content.trim()) {
    errors.content = "Announcement content is required.";
  } else if (values.content.trim().length < 20) {
    errors.content = "Provide at least 20 characters to make the announcement meaningful.";
  }

  return errors;
}
