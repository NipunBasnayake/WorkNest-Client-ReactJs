import { tokenStorage } from "@/services/http/client";
import type { AppNotification, CreateNotificationPayload } from "@/modules/notifications/types";

const STORAGE_ROOT = "wn_mock_notifications";
const LATENCY_MS = 100;
const NOTIFICATION_EVENT = "worknest:notifications:updated";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `notification_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function storageKey() {
  const tenantKey = tokenStorage.getTenantKey() ?? "default";
  return `${STORAGE_ROOT}_${tenantKey}`;
}

function seedNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: randomId(),
      type: "SYSTEM",
      title: "Welcome to WorkNest",
      message: "Your workspace is ready. Start by creating tasks and teams.",
      link: "/app/dashboard",
      read: false,
      createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
    },
    {
      id: randomId(),
      type: "ANNOUNCEMENT",
      title: "Quarterly kickoff",
      message: "A new company announcement has been published.",
      link: "/app/announcements",
      read: false,
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: randomId(),
      type: "TASK_STATUS",
      title: "Task status updated",
      message: "One of your assigned tasks moved to In Progress.",
      link: "/app/tasks",
      read: true,
      createdAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function readNotifications(): AppNotification[] {
  const key = storageKey();
  const raw = localStorage.getItem(key);

  if (!raw) {
    const seeded = seedNotifications();
    localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as AppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNotifications(notifications: AppNotification[]) {
  localStorage.setItem(storageKey(), JSON.stringify(notifications));
}

function emitUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT));
}

export function subscribeNotifications(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(NOTIFICATION_EVENT, listener);
  return () => {
    window.removeEventListener(NOTIFICATION_EVENT, listener);
  };
}

export async function getNotifications(): Promise<AppNotification[]> {
  await sleep(LATENCY_MS);
  return readNotifications().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUnreadNotificationCount(): Promise<number> {
  await sleep(LATENCY_MS);
  return readNotifications().filter((item) => !item.read).length;
}

export async function createNotification(payload: CreateNotificationPayload): Promise<AppNotification> {
  await sleep(LATENCY_MS);

  const next: AppNotification = {
    id: randomId(),
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const notifications = [next, ...readNotifications()];
  writeNotifications(notifications);
  emitUpdated();

  return next;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await sleep(LATENCY_MS);

  const notifications = readNotifications();
  const index = notifications.findIndex((item) => item.id === id);
  if (index < 0) return;
  if (notifications[index].read) return;

  notifications[index] = { ...notifications[index], read: true };
  writeNotifications(notifications);
  emitUpdated();
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await sleep(LATENCY_MS);

  const notifications = readNotifications().map((item) => ({ ...item, read: true }));
  writeNotifications(notifications);
  emitUpdated();
}
