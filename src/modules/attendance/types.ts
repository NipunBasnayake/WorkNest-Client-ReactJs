export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "HALF_DAY" | "INCOMPLETE";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  late?: boolean;
  manualEntry?: boolean;
  note?: string;
  markedByEmployee?: {
    id: string;
    name: string;
    email?: string;
  };
  status: AttendanceStatus;
  workedMinutes?: number;
}

export interface AttendanceSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  incomplete: number;
}

export interface AttendanceActionRequest {
  employeeId: string;
  note?: string;
  manualEntry?: boolean;
}

export type AttendanceActor = AttendanceActionRequest;
