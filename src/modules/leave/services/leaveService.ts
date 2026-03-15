import { tokenStorage } from "@/services/http/client";
import { createNotification } from "@/modules/notifications/services/notificationService";
import type { LeavePayload, LeaveRequest, LeaveStatus } from "@/modules/leave/types";

const STORAGE_ROOT = "wn_mock_leave_requests";
const LATENCY_MS = 220;

interface ReviewPayload {
  reviewerId: string;
  reviewerName: string;
  comment?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `leave_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function storageKey() {
  const tenantKey = tokenStorage.getTenantKey() ?? "default";
  return `${STORAGE_ROOT}_${tenantKey}`;
}

function seedLeaveRequests(): LeaveRequest[] {
  const now = new Date().toISOString();
  return [
    {
      id: randomId(),
      employeeId: "seed_emp_1",
      employeeName: "Asha Fernando",
      leaveType: "ANNUAL",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      reason: "Planned personal travel.",
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomId(),
      employeeId: "seed_emp_2",
      employeeName: "Nimal Silva",
      leaveType: "SICK",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      reason: "Medical rest advised.",
      status: "APPROVED",
      reviewerId: "seed_admin",
      reviewerName: "Workspace Admin",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function readLeaveRequests(): LeaveRequest[] {
  const key = storageKey();
  const raw = localStorage.getItem(key);

  if (!raw) {
    const seeded = seedLeaveRequests();
    localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as LeaveRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLeaveRequests(requests: LeaveRequest[]) {
  localStorage.setItem(storageKey(), JSON.stringify(requests));
}

async function notifyLeaveUpdate(title: string, message: string, link?: string) {
  try {
    await createNotification({ type: "LEAVE_UPDATE", title, message, link });
  } catch {
    // Notification failures should not block leave actions.
  }
}

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  await sleep(LATENCY_MS);
  return readLeaveRequests().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLeaveRequestById(id: string): Promise<LeaveRequest> {
  await sleep(LATENCY_MS);
  const request = readLeaveRequests().find((item) => item.id === id);
  if (!request) throw new Error("Leave request not found");
  return request;
}

export async function createLeaveRequest(payload: LeavePayload): Promise<LeaveRequest> {
  await sleep(LATENCY_MS);

  const now = new Date().toISOString();
  const request: LeaveRequest = {
    id: randomId(),
    employeeId: payload.employeeId,
    employeeName: payload.employeeName,
    leaveType: payload.leaveType,
    startDate: payload.startDate,
    endDate: payload.endDate,
    reason: payload.reason.trim(),
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  };

  const next = [request, ...readLeaveRequests()];
  writeLeaveRequests(next);
  await notifyLeaveUpdate("Leave request submitted", `${request.employeeName} submitted a leave request.`, `/app/leave/${request.id}`);
  return request;
}

export async function updateLeaveRequest(id: string, payload: Omit<LeavePayload, "employeeId" | "employeeName">): Promise<LeaveRequest> {
  await sleep(LATENCY_MS);

  const requests = readLeaveRequests();
  const index = requests.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Leave request not found");
  if (requests[index].status !== "PENDING") throw new Error("Only pending leave requests can be edited.");

  const next: LeaveRequest = {
    ...requests[index],
    leaveType: payload.leaveType,
    startDate: payload.startDate,
    endDate: payload.endDate,
    reason: payload.reason.trim(),
    updatedAt: new Date().toISOString(),
  };

  requests[index] = next;
  writeLeaveRequests(requests);
  await notifyLeaveUpdate("Leave request updated", `${next.employeeName} updated a leave request.`, `/app/leave/${next.id}`);
  return next;
}

export async function cancelLeaveRequest(id: string): Promise<LeaveRequest> {
  await sleep(LATENCY_MS);

  const requests = readLeaveRequests();
  const index = requests.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Leave request not found");
  if (requests[index].status !== "PENDING") throw new Error("Only pending leave requests can be cancelled.");

  const next: LeaveRequest = {
    ...requests[index],
    status: "CANCELLED",
    updatedAt: new Date().toISOString(),
  };

  requests[index] = next;
  writeLeaveRequests(requests);
  await notifyLeaveUpdate("Leave request cancelled", `${next.employeeName} cancelled a leave request.`, `/app/leave/${next.id}`);
  return next;
}

export async function reviewLeaveRequest(id: string, status: Extract<LeaveStatus, "APPROVED" | "REJECTED">, review: ReviewPayload): Promise<LeaveRequest> {
  await sleep(LATENCY_MS);

  const requests = readLeaveRequests();
  const index = requests.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Leave request not found");
  if (requests[index].status !== "PENDING") throw new Error("Only pending leave requests can be reviewed.");

  const next: LeaveRequest = {
    ...requests[index],
    status,
    reviewerId: review.reviewerId,
    reviewerName: review.reviewerName,
    reviewComment: review.comment?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };

  requests[index] = next;
  writeLeaveRequests(requests);
  await notifyLeaveUpdate(
    status === "APPROVED" ? "Leave approved" : "Leave rejected",
    `${next.employeeName}'s leave request is now ${status.toLowerCase()}.`,
    `/app/leave/${next.id}`
  );
  return next;
}
