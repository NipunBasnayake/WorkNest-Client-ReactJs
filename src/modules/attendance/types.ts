export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "HALF_DAY";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  workedMinutes?: number;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
}

export interface AttendanceActor {
  employeeId: string;
  employeeName: string;
}
