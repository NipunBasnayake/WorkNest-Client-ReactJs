import { apiClient, buildTenantApiUrl } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getBoolean, getId, getNumber, getString, toIsoDateTime } from "@/services/http/parsers";
import { tokenStorage } from "@/services/auth/tokenStorage";
import { readRealtimeDestinations, subscribeRealtime } from "@/services/realtime/stompService";
import type { AppNotification, CreateNotificationPayload } from "@/modules/notifications/types";
import type { ApiResponse } from "@/types";
import { tenantRoutes } from "@/utils/tenantRoutes";

const NOTIFICATION_EVENT = "worknest:notifications:updated";
const NOTIFICATION_REALTIME_FALLBACKS = readRealtimeDestinations("VITE_NOTIFICATIONS_TOPICS", [
  "/user/queue/notifications",
  "/topic/notifications",
]);
const notificationListeners = new Set<() => void>();
let realtimeBridgeUnsubscribe: (() => void) | null = null;

function emitUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT));
}

export function notifyNotificationsUpdated() {
  emitUpdated();
}

function buildRealtimeDestinations(): string[] {
  const tenantKey = tokenStorage.getTenantKey();
  const tenantDestinations = tenantKey ? [`/topic/tenant/${tenantKey}/notifications`] : [];
  return [...new Set([...tenantDestinations, ...NOTIFICATION_REALTIME_FALLBACKS])];
}

function ensureRealtimeBridge() {
  if (realtimeBridgeUnsubscribe) return;

  const unsubscribe = subscribeRealtime(buildRealtimeDestinations(), () => {
    emitUpdated();
  });
  realtimeBridgeUnsubscribe = unsubscribe;
}

function releaseRealtimeBridge() {
  if (notificationListeners.size > 0) return;
  realtimeBridgeUnsubscribe?.();
  realtimeBridgeUnsubscribe = null;
}

function buildReferenceLink(referenceType?: string, referenceId?: string): string | undefined {
  if (!referenceType || !referenceId) return undefined;
  const type = referenceType.toUpperCase();
  if (type === "TASK") return tenantRoutes.taskDetail(referenceId);
  if (type === "LEAVE" || type === "LEAVE_REQUEST") return tenantRoutes.leaveDetail(referenceId);
  if (type === "PROJECT") return tenantRoutes.projectDetail(referenceId);
  if (type === "ANNOUNCEMENT") return tenantRoutes.announcementDetail(referenceId);
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
    resolvedAnnouncementId ? tenantRoutes.announcementDetail(resolvedAnnouncementId) : undefined,
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
  const safeListener = () => {
    try {
      listener();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Notification realtime listener failed:", error);
      }
    }
  };

  notificationListeners.add(safeListener);
  ensureRealtimeBridge();

  window.addEventListener(NOTIFICATION_EVENT, safeListener);
  let cleanedUp = false;
  return () => {
    if (cleanedUp) return;
    cleanedUp = true;
    window.removeEventListener(NOTIFICATION_EVENT, safeListener);
    notificationListeners.delete(safeListener);
    releaseRealtimeBridge();
  };
}

export async function getNotifications(): Promise<AppNotification[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(buildTenantApiUrl("/notifications/my"));
  return extractList(unwrapApiData<unknown>(data))
    .map(normalizeNotification)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(buildTenantApiUrl("/notifications/my/unread-count"));
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
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(buildTenantApiUrl("/notifications"), {
    type: payload.type,
    message: payload.message,
    referenceType: "SYSTEM",
  });

  const normalized = normalizeNotification(unwrapApiData<unknown>(data));
  emitUpdated();
  return normalized;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await apiClient.patch(buildTenantApiUrl(`/notifications/${id}/read`));
  emitUpdated();
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.patch(buildTenantApiUrl("/notifications/read-all"));
  emitUpdated();
}
