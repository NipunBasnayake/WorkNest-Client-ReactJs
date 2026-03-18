import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getId, getNumber, getString, toIsoDate } from "@/services/http/parsers";
import type { AttendanceActor, AttendanceRecord, AttendanceStatus, AttendanceSummary } from "@/modules/attendance/types";
import type { ApiResponse } from "@/types";

function statusFrom(value: unknown): AttendanceStatus {
  const normalized = getString(value)?.toUpperCase();
  if (normalized === "LATE") return "LATE";
  if (normalized === "ABSENT") return "ABSENT";
  if (normalized === "HALF_DAY") return "HALF_DAY";
  return "PRESENT";
}

function normalizeRecord(input: unknown): AttendanceRecord {
  const value = asRecord(input);
  const checkIn = firstDefined(getString(value.checkIn), getString(value.checkInTime));
  const checkOut = firstDefined(getString(value.checkOut), getString(value.checkOutTime));

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
    workedMinutes: firstDefined(
      getNumber(value.workedMinutes),
      getNumber(value.workMinutes),
      getNumber(value.totalMinutes)
    ),
  };
}

function summarize(records: AttendanceRecord[]): AttendanceSummary {
  return records.reduce<AttendanceSummary>(
    (acc, record) => {
      acc.total += 1;
      if (record.status === "PRESENT") acc.present += 1;
      if (record.status === "LATE") acc.late += 1;
      if (record.status === "ABSENT") acc.absent += 1;
      if (record.status === "HALF_DAY") acc.halfDay += 1;
      return acc;
    },
    { total: 0, present: 0, late: 0, absent: 0, halfDay: 0 }
  );
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getAttendanceRecords(date?: string): Promise<AttendanceRecord[]> {
  const targetDate = date ?? today();
  try {
    const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(`/api/tenant/attendance/date/${targetDate}`);
    const list = extractList(unwrapApiData<unknown>(data));
    return list.map(normalizeRecord).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  } catch {
    const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/attendance/my");
    const list = extractList(unwrapApiData<unknown>(data)).map(normalizeRecord);
    return list.filter((item) => item.date === targetDate);
  }
}

export async function getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/attendance/my");
  return extractList(unwrapApiData<unknown>(data))
    .map(normalizeRecord)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getAttendanceSummary(date?: string): Promise<AttendanceSummary> {
  const workDate = date ?? today();
  try {
    const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/attendance/summary/daily", {
      params: { workDate },
    });
    const summary = asRecord(unwrapApiData<unknown>(data));
    return {
      total: getNumber(summary.total) ?? 0,
      present: getNumber(summary.present) ?? 0,
      late: getNumber(summary.late) ?? 0,
      absent: getNumber(summary.absent) ?? 0,
      halfDay: getNumber(firstDefined(summary.halfDay, summary.half_day)) ?? 0,
    };
  } catch {
    return summarize(await getAttendanceRecords(workDate));
  }
}

export async function checkIn(actor: AttendanceActor): Promise<AttendanceRecord> {
  void actor;
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>("/api/tenant/attendance/my/check-in");
  return normalizeRecord(unwrapApiData<unknown>(data));
}

export async function checkOut(actor: AttendanceActor): Promise<AttendanceRecord> {
  void actor;
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>("/api/tenant/attendance/my/check-out");
  return normalizeRecord(unwrapApiData<unknown>(data));
}

export async function getAttendanceTrend(days = 7): Promise<Array<{ date: string; present: number; late: number; absent: number }>> {
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
    };
  });
}
