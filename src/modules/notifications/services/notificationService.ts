import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getBoolean, getId, getNumber, getString, toIsoDateTime } from "@/services/http/parsers";
import { readRealtimeDestinations, subscribeRealtime } from "@/services/realtime/stompService";
import type { AppNotification, CreateNotificationPayload } from "@/modules/notifications/types";
import type { ApiResponse } from "@/types";

const NOTIFICATION_EVENT = "worknest:notifications:updated";
const NOTIFICATION_REALTIME_DESTINATIONS = readRealtimeDestinations("VITE_NOTIFICATIONS_TOPICS", [
  "/user/queue/notifications",
  "/topic/tenant/notifications",
  "/topic/notifications",
]);
let realtimeBridgeInitialized = false;

function emitUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT));
}

function ensureRealtimeBridge() {
  if (realtimeBridgeInitialized) return;
  realtimeBridgeInitialized = true;

  subscribeRealtime(NOTIFICATION_REALTIME_DESTINATIONS, () => {
    emitUpdated();
  });
}

function buildReferenceLink(referenceType?: string, referenceId?: string): string | undefined {
  if (!referenceType || !referenceId) return undefined;
  const type = referenceType.toUpperCase();
  if (type === "TASK") return `/app/tasks/${referenceId}`;
  if (type === "LEAVE" || type === "LEAVE_REQUEST") return `/app/leave/${referenceId}`;
  if (type === "PROJECT") return `/app/projects/${referenceId}`;
  if (type === "ANNOUNCEMENT") return `/app/announcements/${referenceId}`;
  return undefined;
}

function normalizeEntityType(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toUpperCase() : undefined;
}

function resolveAnnouncementId(
  type: string,
  relatedEntityType?: string,
  relatedEntityId?: string,
  referenceType?: string,
  referenceId?: string,
  announcementId?: string
): string | undefined {
  if (announcementId) return announcementId;
  if (relatedEntityType === "ANNOUNCEMENT" && relatedEntityId) return relatedEntityId;
  if (referenceType === "ANNOUNCEMENT" && referenceId) return referenceId;
  if (type === "ANNOUNCEMENT") return relatedEntityId ?? referenceId;
  return undefined;
}

function normalizeNotification(input: unknown): AppNotification {
  const value = asRecord(input);
  const referenceType = normalizeEntityType(getString(firstDefined(value.referenceType, value.entityType)));
  const referenceId = getString(firstDefined(value.referenceId, value.entityId));
  const relatedEntityType = normalizeEntityType(getString(firstDefined(value.relatedEntityType, value.entityType)));
  const relatedEntityId = getString(firstDefined(value.relatedEntityId, value.entityId));
  const type = (getString(value.type)?.toUpperCase() ?? "SYSTEM") as AppNotification["type"];
  const announcementId = getString(value.announcementId);
  const resolvedAnnouncementId = resolveAnnouncementId(
    type,
    relatedEntityType,
    relatedEntityId,
    referenceType,
    referenceId,
    announcementId
  );
  const link = firstDefined(
    getString(value.link),
    resolvedAnnouncementId ? `/app/announcements/${resolvedAnnouncementId}` : undefined,
    buildReferenceLink(relatedEntityType ?? referenceType, relatedEntityId ?? referenceId)
  );

  return {
    id: getId(firstDefined(value.id, value.notificationId)),
    type,
    title: firstDefined(getString(value.title), getString(value.subject), toReadableType(type)) ?? "Notification",
    message: getString(value.message) ?? "",
    link,
    referenceType,
    referenceId,
    relatedEntityType,
    relatedEntityId,
    announcementId: resolvedAnnouncementId,
    read: getBoolean(firstDefined(value.read, value.isRead)) ?? false,
    createdAt: toIsoDateTime(firstDefined(value.createdAt, value.createdDate)),
  };
}

function toReadableType(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function subscribeNotifications(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  ensureRealtimeBridge();

  window.addEventListener(NOTIFICATION_EVENT, listener);
  return () => {
    window.removeEventListener(NOTIFICATION_EVENT, listener);
  };
}

export async function getNotifications(): Promise<AppNotification[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/notifications/my");
  return extractList(unwrapApiData<unknown>(data))
    .map(normalizeNotification)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/notifications/my/unread-count");
  const parsed = unwrapApiData<unknown>(data);
  if (typeof parsed === "number") return parsed;
  const value = asRecord(parsed);
  return firstDefined(
    getNumber(value.count),
    getNumber(value.unreadCount),
    getNumber(value.total)
  ) ?? 0;
}

export async function createNotification(payload: CreateNotificationPayload): Promise<AppNotification> {
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>("/api/tenant/notifications", {
    type: payload.type,
    message: payload.message,
    referenceType: "SYSTEM",
  });

  const normalized = normalizeNotification(unwrapApiData<unknown>(data));
  emitUpdated();
  return normalized;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await apiClient.patch(`/api/tenant/notifications/${id}/read`);
  emitUpdated();
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.patch("/api/tenant/notifications/read-all");
  emitUpdated();
}
