import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { LeavePage } from "@/pages/app/LeavePage";
import { useAuthStore } from "@/store/authStore";
import { getLeaveRequests } from "@/modules/leave/services/leaveService";

vi.mock("@/modules/leave/services/leaveService", () => ({
  getLeaveRequests: vi.fn(),
  cancelLeaveRequest: vi.fn(),
  reviewLeaveRequest: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <LeavePage />
    </MemoryRouter>
  );
}

describe("LeavePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      sessionType: "tenant",
      tenantKey: "acme",
      user: { id: "99", name: "Approver", email: "approver@worknest.test", role: "HR", tenantKey: "acme" },
      isBootstrapping: false,
      isLoading: false,
      error: null,
    });
  });

  it("shows approval actions for employee leaves but not HR leaves or self requests", async () => {
    vi.mocked(getLeaveRequests).mockResolvedValueOnce([
      {
        id: "1",
        employeeId: "10",
        employeeName: "Employee User",
        employeeRole: "EMPLOYEE",
        leaveType: "ANNUAL",
        startDate: "2026-04-20",
        endDate: "2026-04-21",
        reason: "Vacation",
        status: "PENDING",
        attachments: [],
        createdAt: "2026-04-14T08:00:00Z",
        updatedAt: "2026-04-14T08:00:00Z",
      },
      {
        id: "2",
        employeeId: "11",
        employeeName: "Hr User",
        employeeRole: "HR",
        leaveType: "SICK",
        startDate: "2026-04-22",
        endDate: "2026-04-23",
        reason: "Medical",
        status: "PENDING",
        attachments: [],
        createdAt: "2026-04-14T08:00:00Z",
        updatedAt: "2026-04-14T08:00:00Z",
      },
      {
        id: "3",
        employeeId: "99",
        employeeName: "Approver",
        employeeRole: "HR",
        leaveType: "CASUAL",
        startDate: "2026-04-24",
        endDate: "2026-04-24",
        reason: "Personal",
        status: "PENDING",
        attachments: [],
        createdAt: "2026-04-14T08:00:00Z",
        updatedAt: "2026-04-14T08:00:00Z",
      },
    ] as never[]);

    renderPage();

    await waitFor(() => expect(getLeaveRequests).toHaveBeenCalled());
    expect(screen.getAllByLabelText("Approve leave request")).toHaveLength(1);
    expect(screen.getAllByLabelText("Reject leave request")).toHaveLength(1);
    expect(screen.getAllByLabelText("Edit leave request")).toHaveLength(1);
    expect(screen.getAllByLabelText("Cancel leave request")).toHaveLength(1);
  });

  it("allows tenant admins to approve HR leave requests", async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      sessionType: "tenant",
      tenantKey: "acme",
      user: { id: "200", name: "Tenant Admin", email: "admin@worknest.test", role: "TENANT_ADMIN", tenantKey: "acme" },
      isBootstrapping: false,
      isLoading: false,
      error: null,
    });

    vi.mocked(getLeaveRequests).mockResolvedValueOnce([
      {
        id: "4",
        employeeId: "11",
        employeeName: "Hr User",
        employeeRole: "HR",
        leaveType: "ANNUAL",
        startDate: "2026-04-20",
        endDate: "2026-04-21",
        reason: "Vacation",
        status: "PENDING",
        attachments: [],
        createdAt: "2026-04-14T08:00:00Z",
        updatedAt: "2026-04-14T08:00:00Z",
      },
    ] as never[]);

    renderPage();

    await waitFor(() => expect(getLeaveRequests).toHaveBeenCalled());
    expect(screen.getAllByLabelText("Approve leave request")).toHaveLength(1);
    expect(screen.getAllByLabelText("Reject leave request")).toHaveLength(1);
  });
});
