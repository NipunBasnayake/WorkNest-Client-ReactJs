import type { UploadedFileAsset } from "@/types";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorRole?: string;
  teamId?: string;
  teamName?: string;
  ownedByCurrentUser: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
  attachments?: UploadedFileAsset[];
}

export interface AnnouncementPayload {
  title: string;
  content: string;
  pinned?: boolean;
  teamId?: string;
  attachments?: UploadedFileAsset[];
}

export interface AnnouncementFormValues {
  title: string;
  content: string;
  pinned: boolean;
  attachments: UploadedFileAsset[];
}

export type AnnouncementFormErrors = Partial<Record<keyof AnnouncementFormValues, string>>;
