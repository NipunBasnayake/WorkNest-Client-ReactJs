import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getId, getString, toIsoDate, toIsoDateTime } from "@/services/http/parsers";
import { PERMISSIONS } from "@/constants/permissions";
import { getRolePermissions } from "@/constants/rolePermissionMap";
import { extractUploadedFileAssets } from "@/services/uploads/fileAssetParser";
import { useAuthStore } from "@/store/authStore";
import type { LeavePayload, LeaveRequest, LeaveStatus } from "@/modules/leave/types";
import type { ApiResponse } from "@/types";

interface ReviewPayload {
  decisionComment?: string;
}

interface LeaveAttachmentRequest {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

function inferAttachmentType(file: { name: string; mimeType?: string }): string {
  if (file.mimeType?.trim()) return file.mimeType;
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.match(/\.(png|jpg|jpeg|webp|gif|svg)$/)) return "image/*";
  return "application/octet-stream";
}

function normalizeLeaveStatus(value: unknown): LeaveStatus {
  const status = getString(value)?.toUpperCase();
  if (status === "APPROVED") return "APPROVED";
  if (status === "REJECTED") return "REJECTED";
  if (status === "CANCELLED") return "CANCELLED";
  return "PENDING";
}

function normalizeLeave(input: unknown): LeaveRequest {
  const value = asRecord(input);
  return {
    id: getId(firstDefined(value.id, value.leaveId)),
    employeeId: getId(firstDefined(value.employeeId, value.requesterEmployeeId, asRecord(value.employee).id)),
    employeeName: firstDefined(
      getString(value.employeeName),
      getString(value.requesterName),
      getString(asRecord(value.employee).fullName),
      getString(asRecord(value.employee).name)
    ) ?? "Employee",
    employeeRole: getString(asRecord(value.employee).role),
    leaveType: (getString(firstDefined(value.leaveType, value.type))?.toUpperCase() ?? "ANNUAL") as LeaveRequest["leaveType"],
    startDate: toIsoDate(firstDefined(value.startDate, value.fromDate)),
    endDate: toIsoDate(firstDefined(value.endDate, value.toDate)),
    reason: getString(value.reason) ?? "",
    status: normalizeLeaveStatus(firstDefined(value.status, value.leaveStatus)),
    approverId: firstDefined(
      getString(asRecord(value.approver).id),
      getString(value.approverId),
      getString(value.decidedById),
      getString(value.reviewerId),
    ),
    approverName: firstDefined(
      getString(asRecord(value.approver).fullName),
      getString(asRecord(value.approver).name),
      getString(value.approverName),
      getString(value.decidedByName),
      getString(value.reviewerName)
    ),
    approverRole: getString(asRecord(value.approver).role),
    reviewerId: firstDefined(
      getString(value.reviewerId),
      getString(value.approverEmployeeId),
      getString(asRecord(value.reviewer).id)
    ),
    reviewerName: firstDefined(
      getString(value.reviewerName),
      getString(value.approverName),
      getString(asRecord(value.reviewer).fullName),
      getString(asRecord(value.reviewer).name)
    ),
    reviewComment: firstDefined(
      getString(value.reviewComment),
      getString(value.comment),
      getString(value.approvalReason)
    ),
    decisionComment: firstDefined(
      getString(value.decisionComment),
      getString(value.reviewComment)
    ),
    decidedAt: toIsoDateTime(firstDefined(value.decidedAt, value.reviewedAt, value.decisionAt)),
    attachments: extractUploadedFileAssets(
      firstDefined(value.attachments, value.files),
      firstDefined(value.attachmentUrls, value.fileUrls)
    ),
    createdAt: toIsoDateTime(firstDefined(value.createdAt, value.createdDate)),
    updatedAt: toIsoDateTime(firstDefined(value.updatedAt, value.updatedDate, value.modifiedAt)),
  };
}

function isReviewerRole(role?: string): boolean {
  return getRolePermissions(role).includes(PERMISSIONS.LEAVE_REVIEW);
}

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const role = useAuthStore.getState().user?.role;
  if (isReviewerRole(typeof role === "string" ? role : undefined)) {
    const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/leaves/paged", {
      params: { page: 0, size: 100, sortBy: "createdAt", sortDir: "desc" },
    });
    return extractList(unwrapApiData<unknown>(data)).map(normalizeLeave);
  }

  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/leaves/my");
  return extractList(unwrapApiData<unknown>(data)).map(normalizeLeave);
}

export async function getLeaveRequestById(id: string): Promise<LeaveRequest> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(`/api/tenant/leaves/${id}`);
  return normalizeLeave(unwrapApiData<unknown>(data));
}

export async function createLeaveRequest(payload: LeavePayload): Promise<LeaveRequest> {
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>("/api/tenant/leaves/apply", {
    leaveType: payload.leaveType,
    startDate: payload.startDate,
    endDate: payload.endDate,
    reason: payload.reason.trim(),
    attachments: payload.attachments.map<LeaveAttachmentRequest>((attachment) => ({
      fileUrl: attachment.url,
      fileName: attachment.name,
      fileType: inferAttachmentType(attachment),
      fileSize: attachment.size ?? 1,
    })),
  });
  return normalizeLeave(unwrapApiData<unknown>(data));
}

export async function updateLeaveRequest(id: string, payload: Omit<LeavePayload, "employeeId" | "employeeName">): Promise<LeaveRequest> {
  const { data } = await apiClient.put<ApiResponse<unknown> | unknown>(`/api/tenant/leaves/${id}`, {
    leaveType: payload.leaveType,
    startDate: payload.startDate,
    endDate: payload.endDate,
    reason: payload.reason.trim(),
    attachments: payload.attachments.map<LeaveAttachmentRequest>((attachment) => ({
      fileUrl: attachment.url,
      fileName: attachment.name,
      fileType: inferAttachmentType(attachment),
      fileSize: attachment.size ?? 1,
    })),
  });
  return normalizeLeave(unwrapApiData<unknown>(data));
}

export async function cancelLeaveRequest(id: string): Promise<LeaveRequest> {
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(`/api/tenant/leaves/${id}/cancel`);
  return normalizeLeave(unwrapApiData<unknown>(data));
}

export async function reviewLeaveRequest(
  id: string,
  status: Extract<LeaveStatus, "APPROVED" | "REJECTED">,
  review?: ReviewPayload
): Promise<LeaveRequest> {
  const endpoint = status === "APPROVED"
    ? `/api/tenant/leaves/${id}/approve`
    : `/api/tenant/leaves/${id}/reject`;

  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(
    endpoint,
    {
      decisionComment: review?.decisionComment?.trim() || (status === "APPROVED" ? "Approved" : "Rejected"),
    }
  );
  return normalizeLeave(unwrapApiData<unknown>(data));
}
