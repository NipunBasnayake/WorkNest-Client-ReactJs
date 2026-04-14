import type { UploadedFileAsset } from "@/types";

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type LeaveType = "ANNUAL" | "SICK" | "CASUAL" | "UNPAID" | "OTHER";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  approverId?: string;
  approverName?: string;
  approverRole?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewComment?: string;
  decisionComment?: string;
  decidedAt?: string;
  attachments: UploadedFileAsset[];
  createdAt: string;
  updatedAt: string;
}

export interface LeavePayload {
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  attachments: UploadedFileAsset[];
}

export interface LeaveFormValues {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  attachments: UploadedFileAsset[];
}

export type LeaveFormErrors = Partial<Record<keyof LeaveFormValues, string>>;

export const LEAVE_TYPE_OPTIONS: LeaveType[] = ["ANNUAL", "SICK", "CASUAL", "UNPAID", "OTHER"];
