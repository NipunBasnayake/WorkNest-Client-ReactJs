import type {
  AnnouncementFormErrors,
  AnnouncementFormValues,
} from "@/modules/announcements/types";

export const DEFAULT_ANNOUNCEMENT_FORM: AnnouncementFormValues = {
  title: "",
  content: "",
  pinned: false,
  teamId: "",
  attachments: [],
};

export function validateAnnouncementForm(
  values: AnnouncementFormValues,
): AnnouncementFormErrors {
  const errors: AnnouncementFormErrors = {};
  const title = values.title.trim();
  const content = values.content.trim();

  if (!title) {
    errors.title = "Announcement title is required.";
  } else if (title.length > 200) {
    errors.title = "Title must not exceed 200 characters.";
  }

  if (!content) {
    errors.content = "Announcement content is required.";
  } else if (content.length > 5000) {
    errors.content = "Content must not exceed 5,000 characters.";
  }

  return errors;
}
