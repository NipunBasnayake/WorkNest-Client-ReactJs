import { tokenStorage } from "@/services/http/client";
import { createNotification } from "@/modules/notifications/services/notificationService";
import type { AttendanceActor, AttendanceRecord, AttendanceSummary, AttendanceStatus } from "@/modules/attendance/types";

const STORAGE_ROOT = "wn_mock_attendance";
const LATENCY_MS = 180;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `attendance_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function storageKey() {
  const tenantKey = tokenStorage.getTenantKey() ?? "default";
  return `${STORAGE_ROOT}_${tenantKey}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function toTimeString(value: Date) {
  return value.toTimeString().slice(0, 5);
}

function seedRecords(): AttendanceRecord[] {
  const date = todayKey();
  return [
    {
      id: randomId(),
      employeeId: "seed_emp_1",
      employeeName: "Asha Fernando",
      date,
      checkIn: "08:59",
      checkOut: "17:05",
      status: "PRESENT",
      workedMinutes: 486,
    },
    {
      id: randomId(),
      employeeId: "seed_emp_2",
      employeeName: "Nimal Silva",
      date,
      checkIn: "09:42",
      status: "LATE",
    },
    {
      id: randomId(),
      employeeId: "seed_emp_3",
      employeeName: "Anjali Perera",
      date,
      status: "ABSENT",
    },
  ];
}

function readRecords(): AttendanceRecord[] {
  const key = storageKey();
  const raw = localStorage.getItem(key);
  if (!raw) {
    const seeded = seedRecords();
    localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as AttendanceRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecords(records: AttendanceRecord[]) {
  localStorage.setItem(storageKey(), JSON.stringify(records));
}

function statusFromCheckIn(time: string): AttendanceStatus {
  return time > "09:30" ? "LATE" : "PRESENT";
}

function workedMinutes(start: string, end: string): number {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  return Math.max(0, endTotal - startTotal);
}

async function notifyAttendanceUpdate(title: string, message: string) {
  try {
    await createNotification({ type: "SYSTEM", title, message, link: "/app/attendance" });
  } catch {
    // Notification updates should not block attendance actions.
  }
}

export async function getAttendanceRecords(date?: string): Promise<AttendanceRecord[]> {
  await sleep(LATENCY_MS);
  const selectedDate = date || todayKey();

  return readRecords()
    .filter((item) => item.date === selectedDate)
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}

export async function getAttendanceSummary(date?: string): Promise<AttendanceSummary> {
  const records = await getAttendanceRecords(date);

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

export async function checkIn(actor: AttendanceActor): Promise<AttendanceRecord> {
  await sleep(LATENCY_MS);

  const records = readRecords();
  const date = todayKey();
  const time = toTimeString(new Date());
  const index = records.findIndex((item) => item.date === date && item.employeeId === actor.employeeId);
  const status = statusFromCheckIn(time);

  if (index >= 0) {
    const next = {
      ...records[index],
      employeeName: actor.employeeName,
      checkIn: time,
      status,
    };
    records[index] = next;
    writeRecords(records);
    await notifyAttendanceUpdate("Checked in", `${actor.employeeName} checked in at ${time}.`);
    return next;
  }

  const next: AttendanceRecord = {
    id: randomId(),
    employeeId: actor.employeeId,
    employeeName: actor.employeeName,
    date,
    checkIn: time,
    status,
  };

  writeRecords([next, ...records]);
  await notifyAttendanceUpdate("Checked in", `${actor.employeeName} checked in at ${time}.`);
  return next;
}

export async function checkOut(actor: AttendanceActor): Promise<AttendanceRecord> {
  await sleep(LATENCY_MS);

  const records = readRecords();
  const date = todayKey();
  const time = toTimeString(new Date());
  const index = records.findIndex((item) => item.date === date && item.employeeId === actor.employeeId);

  if (index < 0) {
    throw new Error("Check-in required before checkout.");
  }

  const existing = records[index];
  if (!existing.checkIn) {
    throw new Error("Check-in required before checkout.");
  }

  const next: AttendanceRecord = {
    ...existing,
    employeeName: actor.employeeName,
    checkOut: time,
    workedMinutes: workedMinutes(existing.checkIn, time),
  };

  records[index] = next;
  writeRecords(records);
  await notifyAttendanceUpdate("Checked out", `${actor.employeeName} checked out at ${time}.`);
  return next;
}
