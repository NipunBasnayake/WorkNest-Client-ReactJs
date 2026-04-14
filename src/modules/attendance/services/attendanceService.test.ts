import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/services/http/client";
import { checkIn, getAttendanceRecords, summarizeAttendance } from "@/modules/attendance/services/attendanceService";

vi.mock("@/services/http/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("attendanceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads self attendance from the dedicated mine endpoint", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            employee: { id: 11, fullName: "Jane Doe" },
            workDate: "2026-04-14",
            status: "PRESENT",
            late: false,
          },
          {
            id: 2,
            employee: { id: 11, fullName: "Jane Doe" },
            workDate: "2026-04-13",
            status: "HALF_DAY",
            late: true,
          },
        ],
      },
    });

    const records = await getAttendanceRecords("2026-04-14", "mine");

    expect(apiClient.get).toHaveBeenCalledWith("/api/tenant/attendance/my");
    expect(records).toHaveLength(1);
    expect(records[0].date).toBe("2026-04-14");
    expect(records[0].status).toBe("PRESENT");
  });

  it("loads workforce attendance from the date endpoint", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            employee: { id: 11, fullName: "Jane Doe" },
            workDate: "2026-04-14",
            status: "PRESENT",
          },
        ],
      },
    });

    await getAttendanceRecords("2026-04-14");

    expect(apiClient.get).toHaveBeenCalledWith("/api/tenant/attendance/date/2026-04-14");
  });

  it("posts manual check-ins to the management endpoint", async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          employee: { id: 11, fullName: "Jane Doe" },
          workDate: "2026-04-14",
          status: "INCOMPLETE",
          late: true,
        },
      },
    });

    await checkIn({ employeeId: "11", manualEntry: true, note: "HR entry" });

    expect(apiClient.post).toHaveBeenCalledWith("/api/tenant/attendance/check-in", {
      employeeId: "11",
      manualEntry: true,
      note: "HR entry",
    });
  });

  it("counts late and incomplete records in summaries", () => {
    const summary = summarizeAttendance([
      { id: "1", employeeId: "11", employeeName: "Jane Doe", date: "2026-04-14", status: "PRESENT", late: true },
      { id: "2", employeeId: "11", employeeName: "Jane Doe", date: "2026-04-14", status: "INCOMPLETE" },
      { id: "3", employeeId: "11", employeeName: "Jane Doe", date: "2026-04-14", status: "HALF_DAY" },
    ]);

    expect(summary).toEqual({
      total: 3,
      present: 1,
      late: 1,
      absent: 0,
      halfDay: 1,
      incomplete: 1,
    });
  });
});