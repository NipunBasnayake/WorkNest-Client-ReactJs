export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_STATUS"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "LEAVE_CANCELLED"
  | "LEAVE_UPDATE"
  | "ANNOUNCEMENT"
  | "HR_MESSAGE"
  | "TEAM_MESSAGE"
  | "PROJECT_UPDATE"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  referenceType?: string;
  referenceId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  announcementId?: string;
  read: boolean;
  createdAt: string;
}

export interface CreateNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export function isAnnouncementLinkedNotification(notification: AppNotification): boolean {
  const type = notification.type?.toUpperCase();
  const relatedType = notification.relatedEntityType?.toUpperCase();
  const referenceType = notification.referenceType?.toUpperCase();
  return Boolean(
    notification.announcementId
    || (relatedType === "ANNOUNCEMENT" && notification.relatedEntityId)
    || (referenceType === "ANNOUNCEMENT" && notification.referenceId)
    || (type === "ANNOUNCEMENT" && (notification.relatedEntityId || notification.referenceId))
  );
}
