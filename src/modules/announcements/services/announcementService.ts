import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getBoolean, getId, getString, toIsoDateTime } from "@/services/http/parsers";
import type { Announcement, AnnouncementPayload } from "@/modules/announcements/types";
import type { ApiResponse } from "@/types";

function normalizeAnnouncement(input: unknown): Announcement {
  const value = asRecord(input);
  const createdBy = asRecord(value.createdBy);

  return {
    id: getId(firstDefined(value.id, value.announcementId)),
    title: getString(value.title) ?? "Announcement",
    content: firstDefined(getString(value.content), getString(value.message), getString(value.body)) ?? "",
    pinned: getBoolean(firstDefined(value.pinned, value.isPinned)) ?? false,
    authorId: firstDefined(
      getString(value.authorId),
      getString(createdBy.id),
      getString(value.createdByEmployeeId),
      getString(asRecord(value.author).id)
    ) ?? "",
    authorName: firstDefined(
      getString(value.authorName),
      getString(createdBy.fullName),
      getString(value.createdByName),
      getString(asRecord(value.author).fullName),
      getString(asRecord(value.author).name)
    ) ?? "Workspace",
    authorRole: firstDefined(
      getString(value.createdByRole),
      getString(value.authorRole),
      getString(createdBy.role),
      getString(asRecord(value.author).role)
    ),
    teamId: getString(value.teamId),
    teamName: getString(value.teamName),
    ownedByCurrentUser: getBoolean(value.ownedByCurrentUser) ?? false,
    canEdit: getBoolean(value.canEdit) ?? false,
    canDelete: getBoolean(value.canDelete) ?? false,
    createdAt: toIsoDateTime(firstDefined(value.createdAt, value.createdDate)),
    updatedAt: toIsoDateTime(firstDefined(value.updatedAt, value.updatedDate, value.modifiedAt)),
  };
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/announcements");
  const unwrapped = unwrapApiData<unknown>(data);
  return extractList(unwrapped)
    .map(normalizeAnnouncement)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAnnouncementById(id: string): Promise<Announcement> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(`/api/tenant/announcements/${id}`);
  return normalizeAnnouncement(unwrapApiData<unknown>(data));
}

export async function createAnnouncement(payload: AnnouncementPayload): Promise<Announcement> {
  const teamId = payload.teamId ? Number(payload.teamId) : undefined;
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>("/api/tenant/announcements", {
    title: payload.title.trim(),
    message: payload.content.trim(),
    ...(Number.isFinite(teamId) ? { teamId } : {}),
  });
  return normalizeAnnouncement(unwrapApiData<unknown>(data));
}

export async function updateAnnouncement(id: string, payload: Pick<AnnouncementPayload, "title" | "content" | "pinned">): Promise<Announcement> {
  const { data } = await apiClient.put<ApiResponse<unknown> | unknown>(`/api/tenant/announcements/${id}`, {
    title: payload.title.trim(),
    message: payload.content.trim(),
  });
  const updated = normalizeAnnouncement(unwrapApiData<unknown>(data));
  return { ...updated, pinned: payload.pinned ?? updated.pinned };
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await apiClient.delete(`/api/tenant/announcements/${id}`);
}
