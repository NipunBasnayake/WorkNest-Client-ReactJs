import type { UserRole } from "@/types";
import type { Announcement } from "@/modules/announcements/types";

function normalizeRole(role?: UserRole | string | null): string {
  return String(role ?? "").trim().toUpperCase();
}

export function canCreateAnnouncements(role?: UserRole | string | null): boolean {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === "TENANT_ADMIN" || normalizedRole === "ADMIN" || normalizedRole === "HR";
}

export function canEditAnnouncement(announcement?: Pick<Announcement, "canEdit"> | null): boolean {
  return Boolean(announcement?.canEdit);
}

export function canDeleteAnnouncement(announcement?: Pick<Announcement, "canDelete"> | null): boolean {
  return Boolean(announcement?.canDelete);
}
