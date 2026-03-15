export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type LeaveType = "ANNUAL" | "SICK" | "CASUAL" | "UNPAID";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewComment?: string;
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
}

export interface LeaveFormValues {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export type LeaveFormErrors = Partial<Record<keyof LeaveFormValues, string>>;

export const LEAVE_TYPE_OPTIONS: LeaveType[] = ["ANNUAL", "SICK", "CASUAL", "UNPAID"];
