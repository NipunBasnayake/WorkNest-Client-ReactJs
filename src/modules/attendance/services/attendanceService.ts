import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getBoolean, getId, getNumber, getString, toIsoDate } from "@/services/http/parsers";
import type { AttendanceActionRequest, AttendanceRecord, AttendanceStatus, AttendanceSummary } from "@/modules/attendance/types";
import type { ApiResponse } from "@/types";

function statusFrom(value: unknown): AttendanceStatus {
  const normalized = getString(value)?.toUpperCase();
  if (normalized === "LATE") return "LATE";
  if (normalized === "ABSENT") return "ABSENT";
  if (normalized === "HALF_DAY") return "HALF_DAY";
  if (normalized === "PRESENT") return "PRESENT";
  return "INCOMPLETE";
}

function normalizeRecord(input: unknown): AttendanceRecord {
  const value = asRecord(input);
  const checkIn = firstDefined(getString(value.checkIn), getString(value.checkInTime));
  const checkOut = firstDefined(getString(value.checkOut), getString(value.checkOutTime));
  const late = firstDefined(
    getBoolean(value.late),
    getBoolean(value.isLate),
    statusFrom(firstDefined(value.status, value.attendanceStatus)) === "LATE"
  ) ?? false;

  const markedByEmployee = asRecord(firstDefined(value.markedByEmployee, value.markedBy));

  return {
    id: getId(firstDefined(value.id, value.attendanceId)),
    employeeId: getId(firstDefined(value.employeeId, asRecord(value.employee).id)),
    employeeName: firstDefined(
      getString(value.employeeName),
      getString(asRecord(value.employee).fullName),
      getString(asRecord(value.employee).name)
    ) ?? "Employee",
    date: toIsoDate(firstDefined(value.date, value.workDate, value.attendanceDate)),
    checkIn,
    checkOut,
    status: statusFrom(firstDefined(value.status, value.attendanceStatus)),
    late,
    manualEntry: firstDefined(getBoolean(value.manualEntry), getBoolean(value.isManualEntry)) ?? false,
    note: firstDefined(getString(value.note), getString(value.remarks)),
    markedByEmployee: getId(firstDefined(markedByEmployee.id, markedByEmployee.employeeId))
      ? {
          id: getId(firstDefined(markedByEmployee.id, markedByEmployee.employeeId)),
          name: firstDefined(getString(markedByEmployee.name), getString(markedByEmployee.fullName)) ?? "Employee",
          email: firstDefined(getString(markedByEmployee.email), getString(markedByEmployee.workEmail)),
        }
      : undefined,
    workedMinutes: firstDefined(
      getNumber(value.workedMinutes),
      getNumber(value.workMinutes),
      getNumber(value.totalMinutes)
    ),
  };
}

export function summarizeAttendance(records: AttendanceRecord[]): AttendanceSummary {
  return records.reduce<AttendanceSummary>(
    (acc, record) => {
      acc.total += 1;
      if (record.status === "PRESENT") acc.present += 1;
      if (record.status === "ABSENT") acc.absent += 1;
      if (record.status === "HALF_DAY") acc.halfDay += 1;
      if (record.status === "INCOMPLETE") acc.incomplete += 1;
      if (record.late || record.status === "LATE") acc.late += 1;
      return acc;
    },
    { total: 0, present: 0, late: 0, absent: 0, halfDay: 0, incomplete: 0 }
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getAttendanceRecords(date?: string, scope: "all" | "mine" = "all"): Promise<AttendanceRecord[]> {
  const targetDate = date ?? today();

  if (scope === "mine") {
    const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/attendance/my");
    const list = extractList(unwrapApiData<unknown>(data)).map(normalizeRecord);
    return list.filter((item) => item.date === targetDate).sort((a, b) => b.date.localeCompare(a.date));
  }

  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(`/api/tenant/attendance/date/${targetDate}`);
  const list = extractList(unwrapApiData<unknown>(data));
  return list.map(normalizeRecord).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}

export async function getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/attendance/my");
  return extractList(unwrapApiData<unknown>(data))
    .map(normalizeRecord)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getAttendanceSummary(date?: string): Promise<AttendanceSummary> {
  const workDate = date ?? today();
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/attendance/summary/daily", {
    params: { workDate },
  });
  const payload = asRecord(unwrapApiData<unknown>(data));
  const nested = asRecord(firstDefined(payload.todayAttendance, payload.summary, payload.dailySummary));

  return {
    total: firstDefined(
      getNumber(payload.total),
      getNumber(payload.totalCount),
      getNumber(payload.totalAttendance),
      getNumber(nested.total),
      getNumber(nested.totalCount)
    ) ?? 0,
    present: firstDefined(
      getNumber(payload.present),
      getNumber(payload.presentCount),
      getNumber(payload.presentToday),
      getNumber(payload.todayPresent),
      getNumber(nested.present),
      getNumber(nested.presentCount)
    ) ?? 0,
    late: firstDefined(
      getNumber(payload.late),
      getNumber(payload.lateCount),
      getNumber(nested.late),
      getNumber(nested.lateCount)
    ) ?? 0,
    absent: firstDefined(
      getNumber(payload.absent),
      getNumber(payload.absentCount),
      getNumber(nested.absent),
      getNumber(nested.absentCount)
    ) ?? 0,
    halfDay: firstDefined(
      getNumber(payload.halfDay),
      getNumber(payload.half_day),
      getNumber(payload.halfDayCount),
      getNumber(nested.halfDay),
      getNumber(nested.half_day),
      getNumber(nested.halfDayCount)
    ) ?? 0,
    incomplete: firstDefined(
      getNumber(payload.incomplete),
      getNumber(payload.incompleteCount),
      getNumber(nested.incomplete),
      getNumber(nested.incompleteCount)
    ) ?? 0,
  };
}

export async function checkIn(actor: AttendanceActionRequest): Promise<AttendanceRecord> {
  const endpoint = actor.manualEntry ? "/api/tenant/attendance/check-in" : "/api/tenant/attendance/my/check-in";
  const payload = actor.manualEntry
    ? {
        employeeId: actor.employeeId,
        manualEntry: true,
        ...(actor.note ? { note: actor.note } : {}),
      }
    : undefined;

  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(endpoint, payload);
  return normalizeRecord(unwrapApiData<unknown>(data));
}

export async function checkOut(actor: AttendanceActionRequest): Promise<AttendanceRecord> {
  const endpoint = actor.manualEntry ? "/api/tenant/attendance/check-out" : "/api/tenant/attendance/my/check-out";
  const payload = actor.manualEntry
    ? {
        employeeId: actor.employeeId,
        manualEntry: true,
        ...(actor.note ? { note: actor.note } : {}),
      }
    : undefined;

  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(endpoint, payload);
  return normalizeRecord(unwrapApiData<unknown>(data));
}

export async function getAttendanceTrend(days = 7): Promise<Array<{ date: string; present: number; late: number; absent: number; halfDay: number; incomplete: number }>> {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - Math.max(1, days - 1));

  const params = {
    fromDate: fromDate.toISOString().slice(0, 10),
    toDate: toDate.toISOString().slice(0, 10),
  };

  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/analytics/attendance/trend", {
    params,
  });
  const list = extractList(unwrapApiData<unknown>(data));

  return list.map((item) => {
    const value = asRecord(item);
    return {
      date: toIsoDate(firstDefined(value.date, value.workDate, value.day)),
      present: getNumber(value.present) ?? 0,
      late: getNumber(value.late) ?? 0,
      absent: getNumber(value.absent) ?? 0,
      halfDay: getNumber(firstDefined(value.halfDay, value.half_day)) ?? 0,
      incomplete: getNumber(firstDefined(value.incomplete, value.incompleteCount)) ?? 0,
    };
  });
}
