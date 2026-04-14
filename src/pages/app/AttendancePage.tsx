import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, LogIn, LogOut, UserCheck, Users2, UserRoundPen, BadgeCheck } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { checkIn, checkOut, getAttendanceRecords, getAttendanceSummary, summarizeAttendance } from "@/modules/attendance/services/attendanceService";
import { AttendanceStatusBadge } from "@/modules/attendance/components/AttendanceStatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner, SkeletonRow, StatCard } from "@/components/common/AppUI";
import type { AttendanceRecord } from "@/modules/attendance/types";
import { getErrorMessage } from "@/utils/errorHandler";
import { getEmployees, getMyEmployeeProfile } from "@/modules/employees/services/employeeService";
import type { Employee } from "@/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatMinutes(value?: number): string {
  if (!value) return "-";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours}h ${minutes}m`;
}

export function AttendancePage() {
  usePageMeta({ title: "Attendance", breadcrumb: ["Workspace", "Attendance"] });
  const { user, role } = useAuth();
  const { hasPermission } = usePermission();

  const [selectedDate, setSelectedDate] = useState(today());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [manualEmployeeId, setManualEmployeeId] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [summary, setSummary] = useState({ total: 0, present: 0, late: 0, absent: 0, halfDay: 0, incomplete: 0 });

  const canViewAll = hasPermission(PERMISSIONS.ATTENDANCE_MANAGE);
  const canMarkOwnAttendance = role === "EMPLOYEE" || role === "HR";
  const canManageManualAttendance = role === "HR";

  useEffect(() => {
    let active = true;

    async function loadIdentity() {
      try {
        const profile = await getMyEmployeeProfile();
        if (!active) return;
        setMyEmployee(profile);
        setManualEmployeeId((current) => current || profile.id);
      } catch {
        if (active) {
          setMyEmployee(null);
        }
      }
    }

    loadIdentity();

    return () => {
      active = false;
    };
  }, [canViewAll]);

  useEffect(() => {
    let active = true;

    async function loadEmployees() {
      if (!canManageManualAttendance) {
        if (active) setEmployees([]);
        return;
      }

      try {
        const list = await getEmployees();
        if (active) {
          setEmployees(list);
          setManualEmployeeId((current) => current || list[0]?.id || "");
        }
      } catch (loadError: unknown) {
        if (active) {
          setFeedback(getErrorMessage(loadError, "Unable to load employee list for manual attendance."));
        }
      }
    }

    loadEmployees();

    return () => {
      active = false;
    };
  }, [canManageManualAttendance]);

  const fetchAttendance = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const recordRes = await getAttendanceRecords(date, canViewAll ? "all" : "mine");
      const summaryRes = canViewAll ? await getAttendanceSummary(date) : summarizeAttendance(recordRes);
      setRecords(recordRes);
      setSummary(summaryRes);
    } catch {
      setError("Unable to load attendance records.");
    } finally {
      setLoading(false);
    }
  }, [canViewAll]);

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [fetchAttendance, selectedDate]);

  const visibleRecords = useMemo(() => {
    return records;
  }, [records]);

  const selfRecord = useMemo(() => {
    if (!myEmployee) return null;
    return records.find((record) => record.employeeId === myEmployee.id) ?? null;
  }, [records, myEmployee]);

  const selectedManualEmployee = useMemo(
    () => employees.find((employee) => employee.id === manualEmployeeId) ?? null,
    [employees, manualEmployeeId]
  );

  const canCheckIn = canMarkOwnAttendance && Boolean(myEmployee) && !actionLoading && !selfRecord?.checkIn;
  const canCheckOut = canMarkOwnAttendance && Boolean(myEmployee) && !actionLoading && Boolean(selfRecord?.checkIn) && !selfRecord?.checkOut;

  const canManualCheckIn = canManageManualAttendance && Boolean(manualEmployeeId) && !actionLoading;
  const canManualCheckOut = canManageManualAttendance && Boolean(manualEmployeeId) && !actionLoading;

  async function handleCheckIn() {
    if (!myEmployee) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await checkIn({ employeeId: myEmployee.id });
      setFeedback("Checked in successfully.");
      await fetchAttendance(selectedDate);
    } catch (actionError: unknown) {
      setFeedback(getErrorMessage(actionError, "Unable to check in right now."));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    if (!myEmployee) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await checkOut({ employeeId: myEmployee.id });
      setFeedback("Checked out successfully.");
      await fetchAttendance(selectedDate);
    } catch (actionError: unknown) {
      setFeedback(getErrorMessage(actionError, "Unable to check out right now."));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleManualCheckIn() {
    if (!manualEmployeeId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await checkIn({ employeeId: manualEmployeeId, manualEntry: true, note: manualNote || undefined });
      setFeedback("Manual check-in recorded.");
      setManualNote("");
      await fetchAttendance(selectedDate);
    } catch (actionError: unknown) {
      setFeedback(getErrorMessage(actionError, "Unable to record manual check-in right now."));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleManualCheckOut() {
    if (!manualEmployeeId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await checkOut({ employeeId: manualEmployeeId, manualEntry: true, note: manualNote || undefined });
      setFeedback("Manual check-out recorded.");
      setManualNote("");
      await fetchAttendance(selectedDate);
    } catch (actionError: unknown) {
      setFeedback(getErrorMessage(actionError, "Unable to record manual check-out right now."));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Track daily attendance and working hours."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
            />
            {canMarkOwnAttendance && (
              <>
                <Button variant="outline" onClick={handleCheckIn} disabled={!canCheckIn}>
                  <LogIn size={16} />
                  Check In
                </Button>
                <Button variant="primary" onClick={handleCheckOut} disabled={!canCheckOut}>
                  <LogOut size={16} />
                  Check Out
                </Button>
              </>
            )}
          </div>
        )}
      />

      {feedback && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: feedback.toLowerCase().includes("unable") || feedback.toLowerCase().includes("required") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
            backgroundColor: feedback.toLowerCase().includes("unable") || feedback.toLowerCase().includes("required") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
            color: feedback.toLowerCase().includes("unable") || feedback.toLowerCase().includes("required") ? "#ef4444" : "#10b981",
          }}
        >
          {feedback}
        </div>
      )}

      {selfRecord && (
        <SectionCard title="My Attendance Snapshot" subtitle={`For ${new Date(selectedDate).toLocaleDateString()}`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoTile icon={<Clock3 size={16} />} label="Check In" value={selfRecord.checkIn || "-"} />
            <InfoTile icon={<Clock3 size={16} />} label="Check Out" value={selfRecord.checkOut || "-"} />
            <InfoTile icon={<CalendarDays size={16} />} label="Worked Time" value={formatMinutes(selfRecord.workedMinutes)} />
            <InfoTile
              icon={<BadgeCheck size={16} />}
              label="Status"
              value={selfRecord.status === "INCOMPLETE" ? "Incomplete" : selfRecord.status.replaceAll("_", " ")}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <AttendanceStatusBadge status={selfRecord.status} />
            {selfRecord.late && <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">Late</span>}
            {selfRecord.manualEntry && <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-semibold text-slate-600">Manual entry</span>}
          </div>
          {selfRecord.note && (
            <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              Note: {selfRecord.note}
            </p>
          )}
          {selfRecord.markedByEmployee && (
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Marked by: {selfRecord.markedByEmployee.name}
            </p>
          )}
        </SectionCard>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Records" value={summary.total} icon={<Users2 size={18} />} accentColor="#9332EA" />
        <StatCard label="Present" value={summary.present} icon={<UserCheck size={18} />} accentColor="#10b981" />
        <StatCard label="Late" value={summary.late} icon={<Clock3 size={18} />} accentColor="#d97706" />
        <StatCard label="Half Day" value={summary.halfDay} icon={<CalendarDays size={18} />} accentColor="#6366f1" />
        <StatCard label="Incomplete" value={summary.incomplete} icon={<LogOut size={18} />} accentColor="#475569" />
        <StatCard label="Absent" value={summary.absent} icon={<CalendarDays size={18} />} accentColor="#ef4444" />
      </div>

      {canManageManualAttendance && (
        <SectionCard
          title="HR Manual Attendance"
          subtitle="Record attendance on behalf of an employee without using the self-service flow."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)]">
            <label className="space-y-2 text-sm">
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>Employee</span>
              <select
                value={manualEmployeeId}
                onChange={(event) => setManualEmployeeId(event.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/30"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              {selectedManualEmployee && (
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {selectedManualEmployee.email}
                </p>
              )}
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>Note</span>
              <textarea
                value={manualNote}
                onChange={(event) => setManualNote(event.target.value)}
                rows={3}
                className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/30"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                placeholder="Optional note for the record"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleManualCheckIn} disabled={!canManualCheckIn}>
              <UserRoundPen size={16} />
              Manual Check In
            </Button>
            <Button variant="primary" onClick={handleManualCheckOut} disabled={!canManualCheckOut}>
              <BadgeCheck size={16} />
              Manual Check Out
            </Button>
          </div>
        </SectionCard>
      )}

      {error && <ErrorBanner message={error} onRetry={() => fetchAttendance(selectedDate)} />}

      <SectionCard className="overflow-hidden" contentClassName="p-0" title="Attendance Records" subtitle={canViewAll ? "Workforce-wide view" : "Your attendance records"}>
        <div className="overflow-x-auto">
          <div
            className="hidden min-w-[900px] md:grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_0.9fr] gap-3 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
          >
            <span>Employee</span>
            <span>Date</span>
            <span>Check In</span>
            <span>Check Out</span>
            <span>Worked</span>
            <span>Status</span>
          </div>

          {loading && Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} cols={6} />)}

        {!loading && !error && visibleRecords.length === 0 && (
          <EmptyState
            title="No attendance records"
            description="No records were found for the selected date."
          />
        )}

        {!loading && visibleRecords.length > 0 && (
          <>
            <div className="hidden min-w-[900px] md:block">
              {visibleRecords.map((record) => (
                <div
                  key={record.id}
                  className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr_0.9fr] items-center gap-3 border-b px-5 py-4"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <span className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {record.employeeName}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{record.date}</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{record.checkIn || "-"}</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{record.checkOut || "-"}</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{formatMinutes(record.workedMinutes)}</span>
                  <AttendanceStatusBadge status={record.status} />
                </div>
              ))}
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {visibleRecords.map((record) => (
                <article
                  key={record.id}
                  className="rounded-xl border p-4"
                  style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {record.employeeName}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span>Date: {record.date}</span>
                    <span>Worked: {formatMinutes(record.workedMinutes)}</span>
                    <span>In: {record.checkIn || "-"}</span>
                    <span>Out: {record.checkOut || "-"}</span>
                  </div>
                  <div className="mt-3">
                    <AttendanceStatusBadge status={record.status} />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        </div>
      </SectionCard>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
        <span style={{ color: "var(--color-primary-500)" }}>{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}

