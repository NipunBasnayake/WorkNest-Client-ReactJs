export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS"
  | "LEAVE_UPDATE"
  | "ANNOUNCEMENT"
  | "PROJECT_UPDATE"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface CreateNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}
