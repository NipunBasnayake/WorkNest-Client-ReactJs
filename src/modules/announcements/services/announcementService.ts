import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import {
  asRecord,
  extractList,
  firstDefined,
  getBoolean,
  getId,
  getString,
  toIsoDateTime,
} from "@/services/http/parsers";
import type {
  Announcement,
  AnnouncementPayload,
} from "@/modules/announcements/types";
import type { ApiResponse } from "@/types";
import {
  listEntityAttachments,
  syncEntityAttachments,
} from "@/services/uploads/attachmentService";

function normalizeAnnouncement(input: unknown): Announcement {
  const value = asRecord(input);
  const createdBy = asRecord(value.createdBy);

  return {
    id: getId(value.id),
    title: getString(value.title) ?? "Announcement",
    content: getString(value.content) ?? "",
    pinned: getBoolean(value.pinned) ?? false,
    authorId:
      firstDefined(
        getString(createdBy.id),
        getString(value.createdByEmployeeId),
      ) ?? "",
    authorName:
      firstDefined(
        getString(createdBy.fullName),
        getString(value.createdByName),
      ) ?? "Workspace",
    authorAvatarUrl: getString(createdBy.avatarUrl),
    authorRole: firstDefined(
      getString(value.createdByRole),
      getString(createdBy.role),
    ),
    teamId: getString(value.teamId),
    teamName: getString(value.teamName),
    ownedByCurrentUser: getBoolean(value.ownedByCurrentUser) ?? false,
    canEdit: getBoolean(value.canEdit) ?? false,
    canDelete: getBoolean(value.canDelete) ?? false,
    createdAt: toIsoDateTime(value.createdAt),
    updatedAt: toIsoDateTime(value.updatedAt),
    attachments: [],
  };
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(
    "/api/tenant/announcements",
  );
  return extractList(unwrapApiData<unknown>(data))
    .map(normalizeAnnouncement)
    .sort((left, right) => {
      if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
      return right.createdAt.localeCompare(left.createdAt);
    });
}

export async function getAnnouncementById(id: string): Promise<Announcement> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(
    `/api/tenant/announcements/${id}`,
  );
  const announcement = normalizeAnnouncement(unwrapApiData<unknown>(data));
  announcement.attachments = await listEntityAttachments("ANNOUNCEMENT", id);
  return announcement;
}

export async function createAnnouncement(
  payload: AnnouncementPayload,
): Promise<Announcement> {
  const teamId = payload.teamId ? Number(payload.teamId) : undefined;
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(
    "/api/tenant/announcements",
    {
      title: payload.title.trim(),
      content: payload.content.trim(),
      pinned: Boolean(payload.pinned),
      teamId: Number.isFinite(teamId) ? teamId : undefined,
    },
  );
  const announcement = normalizeAnnouncement(unwrapApiData<unknown>(data));
  await syncEntityAttachments(
    "ANNOUNCEMENT",
    announcement.id,
    payload.attachments ?? [],
  );
  return getAnnouncementById(announcement.id);
}

export async function updateAnnouncement(
  id: string,
  payload: AnnouncementPayload,
): Promise<Announcement> {
  const teamId = payload.teamId ? Number(payload.teamId) : undefined;
  const { data } = await apiClient.put<ApiResponse<unknown> | unknown>(
    `/api/tenant/announcements/${id}`,
    {
      title: payload.title.trim(),
      content: payload.content.trim(),
      pinned: Boolean(payload.pinned),
      teamId: Number.isFinite(teamId) ? teamId : undefined,
    },
  );
  const announcement = normalizeAnnouncement(unwrapApiData<unknown>(data));
  await syncEntityAttachments(
    "ANNOUNCEMENT",
    announcement.id,
    payload.attachments ?? [],
  );
  return getAnnouncementById(announcement.id);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await apiClient.delete(`/api/tenant/announcements/${id}`);
}

export async function setAnnouncementPinned(
  id: string,
  pinned: boolean,
): Promise<Announcement> {
  const { data } = await apiClient.patch<ApiResponse<unknown> | unknown>(
    `/api/tenant/announcements/${id}/pin`,
    undefined,
    { params: { pinned } },
  );
  return normalizeAnnouncement(unwrapApiData<unknown>(data));
}
