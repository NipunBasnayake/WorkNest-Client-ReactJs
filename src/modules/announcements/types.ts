export interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementPayload {
  title: string;
  content: string;
  pinned: boolean;
  authorId: string;
  authorName: string;
}

export interface AnnouncementFormValues {
  title: string;
  content: string;
  pinned: boolean;
}

export type AnnouncementFormErrors = Partial<Record<keyof AnnouncementFormValues, string>>;
