export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_STATUS"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
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
  read: boolean;
  createdAt: string;
}

export interface CreateNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}
