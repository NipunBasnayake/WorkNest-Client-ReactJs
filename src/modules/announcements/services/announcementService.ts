import { tokenStorage } from "@/services/http/client";
import { createNotification } from "@/modules/notifications/services/notificationService";
import type { Announcement, AnnouncementPayload } from "@/modules/announcements/types";

const STORAGE_ROOT = "wn_mock_announcements";
const LATENCY_MS = 220;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `announcement_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function storageKey() {
  const tenantKey = tokenStorage.getTenantKey() ?? "default";
  return `${STORAGE_ROOT}_${tenantKey}`;
}

function seedAnnouncements(): Announcement[] {
  const now = new Date().toISOString();
  return [
    {
      id: randomId(),
      title: "Welcome to WorkNest",
      content: "Your workspace has been initialized. Start by organizing teams, projects, and task workflows.",
      pinned: true,
      authorId: "seed_admin",
      authorName: "Workspace Admin",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomId(),
      title: "Timesheet reminder",
      content: "Please finalize attendance records before Friday 5 PM to keep monthly payroll on schedule.",
      pinned: false,
      authorId: "seed_hr",
      authorName: "HR Team",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function readAnnouncements(): Announcement[] {
  const key = storageKey();
  const raw = localStorage.getItem(key);

  if (!raw) {
    const seeded = seedAnnouncements();
    localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as Announcement[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAnnouncements(items: Announcement[]) {
  localStorage.setItem(storageKey(), JSON.stringify(items));
}

function sortAnnouncements(items: Announcement[]): Announcement[] {
  return items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

async function notifyAnnouncementEvent(title: string, message: string, link?: string) {
  try {
    await createNotification({ type: "ANNOUNCEMENT", title, message, link });
  } catch {
    // Notification delivery should not block announcement actions.
  }
}

export async function getAnnouncements(): Promise<Announcement[]> {
  await sleep(LATENCY_MS);
  return sortAnnouncements(readAnnouncements());
}

export async function getAnnouncementById(id: string): Promise<Announcement> {
  await sleep(LATENCY_MS);
  const item = readAnnouncements().find((announcement) => announcement.id === id);
  if (!item) throw new Error("Announcement not found");
  return item;
}

export async function createAnnouncement(payload: AnnouncementPayload): Promise<Announcement> {
  await sleep(LATENCY_MS);

  const now = new Date().toISOString();
  const next: Announcement = {
    id: randomId(),
    title: payload.title.trim(),
    content: payload.content.trim(),
    pinned: payload.pinned,
    authorId: payload.authorId,
    authorName: payload.authorName,
    createdAt: now,
    updatedAt: now,
  };

  writeAnnouncements([next, ...readAnnouncements()]);
  await notifyAnnouncementEvent("New announcement posted", next.title, `/app/announcements/${next.id}`);
  return next;
}

export async function updateAnnouncement(id: string, payload: Pick<AnnouncementPayload, "title" | "content" | "pinned">): Promise<Announcement> {
  await sleep(LATENCY_MS);

  const items = readAnnouncements();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Announcement not found");

  const next: Announcement = {
    ...items[index],
    title: payload.title.trim(),
    content: payload.content.trim(),
    pinned: payload.pinned,
    updatedAt: new Date().toISOString(),
  };

  items[index] = next;
  writeAnnouncements(items);
  await notifyAnnouncementEvent("Announcement updated", next.title, `/app/announcements/${next.id}`);
  return next;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await sleep(LATENCY_MS);

  const items = readAnnouncements();
  const target = items.find((announcement) => announcement.id === id);
  writeAnnouncements(items.filter((announcement) => announcement.id !== id));

  if (target) {
    await notifyAnnouncementEvent("Announcement removed", target.title, "/app/announcements");
  }
}
