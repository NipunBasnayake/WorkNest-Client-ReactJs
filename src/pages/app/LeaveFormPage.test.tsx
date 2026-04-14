import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { LeaveFormPage } from "@/pages/app/LeaveFormPage";
import { useAuthStore } from "@/store/authStore";
import { getLeaveRequestById } from "@/modules/leave/services/leaveService";

vi.mock("@/modules/leave/services/leaveService", () => ({
  createLeaveRequest: vi.fn(),
  getLeaveRequestById: vi.fn(),
  updateLeaveRequest: vi.fn(),
}));

function renderPage(path = "/app/leave/1/edit") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/leave/:id/edit" element={<LeaveFormPage />} />
        <Route path="/app/leave/new" element={<LeaveFormPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("LeaveFormPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      sessionType: "tenant",
      tenantKey: "acme",
      user: { id: "10", name: "Employee User", email: "employee@worknest.test", role: "EMPLOYEE", tenantKey: "acme" },
      isBootstrapping: false,
      isLoading: false,
      error: null,
    });
  });

  it("blocks editing finalized leave requests", async () => {
    vi.mocked(getLeaveRequestById).mockResolvedValueOnce({
      id: "1",
      employeeId: "10",
      employeeName: "Employee User",
      employeeRole: "EMPLOYEE",
      leaveType: "ANNUAL",
      startDate: "2026-04-20",
      endDate: "2026-04-21",
      reason: "Vacation",
      status: "APPROVED",
      attachments: [],
      createdAt: "2026-04-14T08:00:00Z",
      updatedAt: "2026-04-14T08:00:00Z",
    } as never);

    renderPage();

    await waitFor(() => expect(screen.getByText("Only pending leave requests can be edited.")).toBeInTheDocument());
  });

  it("blocks editing leave requests owned by another user", async () => {
    vi.mocked(getLeaveRequestById).mockResolvedValueOnce({
      id: "2",
      employeeId: "99",
      employeeName: "Another User",
      employeeRole: "EMPLOYEE",
      leaveType: "ANNUAL",
      startDate: "2026-04-20",
      endDate: "2026-04-21",
      reason: "Vacation",
      status: "PENDING",
      attachments: [],
      createdAt: "2026-04-14T08:00:00Z",
      updatedAt: "2026-04-14T08:00:00Z",
    } as never);

    renderPage();

    await waitFor(() => expect(screen.getByText("You can edit only your own leave requests.")).toBeInTheDocument());
  });
});
