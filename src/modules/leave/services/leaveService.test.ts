import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/services/http/client";
import { createLeaveRequest, reviewLeaveRequest, updateLeaveRequest } from "@/modules/leave/services/leaveService";
import type { LeavePayload } from "@/modules/leave/types";

vi.mock("@/services/http/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe("leaveService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends uploaded attachments as structured metadata when creating a leave request", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          employee: { id: 10, fullName: "Jane Doe", role: "EMPLOYEE" },
          leaveType: "ANNUAL",
          startDate: "2026-04-14",
          endDate: "2026-04-15",
          status: "PENDING",
          attachments: [],
        },
      },
    });

    const payload: LeavePayload = {
      employeeId: "10",
      employeeName: "Jane Doe",
      leaveType: "ANNUAL",
      startDate: "2026-04-14",
      endDate: "2026-04-15",
      reason: "Family event and travel",
      attachments: [
        { name: "note.pdf", url: "/uploads/note.pdf", mimeType: "application/pdf", size: 1200 },
      ],
    };

    await createLeaveRequest(payload);

    expect(apiClient.post).toHaveBeenCalledWith("/api/tenant/leaves/apply", {
      leaveType: "ANNUAL",
      startDate: "2026-04-14",
      endDate: "2026-04-15",
      reason: "Family event and travel",
      attachments: [
        {
          fileUrl: "/uploads/note.pdf",
          fileName: "note.pdf",
          fileType: "application/pdf",
          fileSize: 1200,
        },
      ],
    });
  });

  it("submits decision comments when reviewing a leave request", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          employee: { id: 10, fullName: "Jane Doe", role: "EMPLOYEE" },
          leaveType: "ANNUAL",
          startDate: "2026-04-14",
          endDate: "2026-04-15",
          status: "APPROVED",
          attachments: [],
        },
      },
    });

    await reviewLeaveRequest("1", "APPROVED", { decisionComment: "Approved after checking coverage" });

    expect(apiClient.post).toHaveBeenCalledWith("/api/tenant/leaves/1/approve", {
      decisionComment: "Approved after checking coverage",
    });
  });

  it("updates a leave request with attachment metadata", async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          employee: { id: 10, fullName: "Jane Doe", role: "EMPLOYEE" },
          leaveType: "ANNUAL",
          startDate: "2026-04-14",
          endDate: "2026-04-15",
          status: "PENDING",
          attachments: [],
        },
      },
    });

    const payload: Omit<LeavePayload, "employeeId" | "employeeName"> = {
      leaveType: "ANNUAL",
      startDate: "2026-04-14",
      endDate: "2026-04-15",
      reason: "Family event and travel",
      attachments: [
        { name: "note.pdf", url: "/uploads/note.pdf", mimeType: "application/pdf", size: 1200 },
      ],
    };

    await updateLeaveRequest("1", payload);

    expect(apiClient.put).toHaveBeenCalledWith("/api/tenant/leaves/1", {
      leaveType: "ANNUAL",
      startDate: "2026-04-14",
      endDate: "2026-04-15",
      reason: "Family event and travel",
      attachments: [
        {
          fileUrl: "/uploads/note.pdf",
          fileName: "note.pdf",
          fileType: "application/pdf",
          fileSize: 1200,
        },
      ],
    });
  });
});
