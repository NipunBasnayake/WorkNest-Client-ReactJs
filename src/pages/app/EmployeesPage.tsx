import { useEffect, useMemo, useState } from "react";
import { Building2, CalendarDays, Mail, Phone, Search, UserCheck, UserPlus, UserX, Users } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { getEmployees, updateEmployeeStatus } from "@/modules/employees/services/employeeService";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { AvatarInitials } from "@/components/common/AvatarInitials";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { toEmployeeViewModel } from "@/modules/employees/utils/employeeMapper";
import type { EmployeeViewModel } from "@/modules/employees/types";
import { getErrorMessage } from "@/utils/errorHandler";

type EmployeeStatusFilter = "all" | "active" | "inactive";
type EmployeeRoleFilter = "all" | "TENANT_ADMIN" | "ADMIN" | "MANAGER" | "HR" | "EMPLOYEE";

interface StatusActionTarget {
  employee: EmployeeViewModel;
  nextStatus: "active" | "inactive";
}

export function EmployeesPage() {
  usePageMeta({ title: "Employees", breadcrumb: ["Workspace", "Employees"] });
  const { hasRole } = useAuth();

  const canCreateOrEdit = hasRole("TENANT_ADMIN", "ADMIN", "HR", "MANAGER");
  const canManageStatus = hasRole("TENANT_ADMIN", "ADMIN", "HR");

  const [employees, setEmployees] = useState<EmployeeViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<EmployeeRoleFilter>("all");
  const [statusTarget, setStatusTarget] = useState<StatusActionTarget | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function fetchEmployees() {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmployees();
      setEmployees(data.map(toEmployeeViewModel));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load employees. Please check your connection and try again."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  const departmentOptions = useMemo(() => {
    const unique = new Set(
      employees
        .map((item) => item.department?.trim())
        .filter((item): item is string => Boolean(item))
    );
    return ["all", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [employees]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((emp) => {
      const normalizedRole = String(emp.role ?? "").toUpperCase();
      const normalizedStatus = String(emp.status ?? "active").toLowerCase();

      const matchesSearch = !query || [
        emp.employeeCode,
        emp.displayName,
        emp.email,
        emp.phone,
        emp.position,
        emp.department,
        emp.role,
      ].some((value) => value?.toLowerCase().includes(query));

      const matchesDepartment = departmentFilter === "all" || (emp.department ?? "").toLowerCase() === departmentFilter.toLowerCase();
      const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;
      const matchesRole = roleFilter === "all" || normalizedRole === roleFilter;

      return matchesSearch && matchesDepartment && matchesStatus && matchesRole;
    });
  }, [departmentFilter, employees, roleFilter, search, statusFilter]);

  async function handleStatusConfirm() {
    if (!statusTarget) return;
    setUpdatingStatus(true);
    setFeedback(null);

    try {
      await updateEmployeeStatus(statusTarget.employee.id, statusTarget.nextStatus);
      setEmployees((prev) =>
        prev.map((item) =>
          item.id === statusTarget.employee.id ? { ...item, status: statusTarget.nextStatus } : item
        )
      );
      setFeedback(
        statusTarget.nextStatus === "inactive"
          ? `${statusTarget.employee.displayName} was deactivated.`
          : `${statusTarget.employee.displayName} was activated.`
      );
      setStatusTarget(null);
    } catch (err: unknown) {
      setFeedback(getErrorMessage(err, "Unable to update employee status. Please try again."));
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        description={loading ? "Loading employee roster..." : `${employees.length} employee record${employees.length === 1 ? "" : "s"} found.`}
        actions={canCreateOrEdit ? (
          <Button variant="primary" to="/app/employees/new">
            <UserPlus size={16} />
            Add Employee
          </Button>
        ) : undefined}
      />

      <SectionCard>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-tertiary)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, name, email, role, department..."
              className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            {departmentOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All Departments" : option}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as EmployeeRoleFilter)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            <option value="all">All Roles</option>
            <option value="TENANT_ADMIN">Tenant Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="HR">HR</option>
            <option value="EMPLOYEE">Employee</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EmployeeStatusFilter)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </SectionCard>

      {feedback && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: feedback.toLowerCase().includes("unable") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
            backgroundColor: feedback.toLowerCase().includes("unable") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
            color: feedback.toLowerCase().includes("unable") ? "#ef4444" : "#10b981",
          }}
        >
          {feedback}
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={fetchEmployees} />}

      <SectionCard className="overflow-hidden" contentClassName="p-0" title="Employees" subtitle="View, update, and maintain workforce records.">
        <div className="overflow-x-auto">
          <div
            className="hidden min-w-[1180px] md:grid grid-cols-[1fr_1.8fr_1.8fr_1.2fr_1.2fr_1.1fr_1fr_0.9fr_1.7fr] gap-3 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
          >
            <span>Code</span>
            <span>Name</span>
            <span>Email</span>
            <span>Designation</span>
            <span>Role</span>
            <span>Department</span>
            <span>Joined</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {loading && Array.from({ length: 6 }).map((_, idx) => <SkeletonRow key={idx} cols={9} />)}

          {!loading && !error && filtered.length === 0 && (
            <EmptyState
              icon={<Users size={28} />}
              title={search || departmentFilter !== "all" || statusFilter !== "all" || roleFilter !== "all" ? "No matching employees" : "No employees yet"}
              description={search || departmentFilter !== "all" || statusFilter !== "all" || roleFilter !== "all" ? "Adjust filters to find employees." : "Add your first employee record to start managing your workforce."}
              action={canCreateOrEdit ? <Button variant="outline" to="/app/employees/new">Create Employee</Button> : undefined}
            />
          )}

          {!loading && filtered.length > 0 && (
            <>
              <div className="hidden min-w-[1180px] md:block">
                {filtered.map((emp) => {
                  const currentStatus = String(emp.status ?? "active").toLowerCase() === "inactive" ? "inactive" : "active";
                  const nextStatus = currentStatus === "active" ? "inactive" : "active";

                  return (
                    <div
                      key={emp.id}
                      className="grid grid-cols-[1fr_1.8fr_1.8fr_1.2fr_1.2fr_1.1fr_1fr_0.9fr_1.7fr] items-center gap-3 border-b px-5 py-4"
                      style={{ borderColor: "var(--border-default)" }}
                    >
                      <span className="truncate text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                        {emp.employeeCode || "-"}
                      </span>

                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarInitials name={emp.displayName} size="sm" />
                        <span className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {emp.displayName}
                        </span>
                      </div>

                      <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>{emp.email || "-"}</span>
                      <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>{emp.position || emp.designation || "-"}</span>
                      <span className="truncate text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{toReadableLabel(String(emp.role ?? "EMPLOYEE"))}</span>
                      <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>{emp.department || "-"}</span>
                      <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>{formatDate(emp.joinedAt || emp.joinedDate)}</span>
                      <StatusBadge status={currentStatus} />

                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="sm" to={`/app/employees/${emp.id}`}>View</Button>
                        {canCreateOrEdit && <Button variant="outline" size="sm" to={`/app/employees/${emp.id}/edit`}>Edit</Button>}
                        {canManageStatus && (
                          <Button
                            variant={currentStatus === "active" ? "danger" : "outline"}
                            size="sm"
                            onClick={() => setStatusTarget({ employee: emp, nextStatus })}
                          >
                            {currentStatus === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                            {currentStatus === "active" ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {filtered.map((emp) => {
                  const currentStatus = String(emp.status ?? "active").toLowerCase() === "inactive" ? "inactive" : "active";
                  const nextStatus = currentStatus === "active" ? "inactive" : "active";

                  return (
                    <article
                      key={emp.id}
                      className="rounded-xl border p-4"
                      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
                    >
                      <div className="flex items-start gap-3">
                        <AvatarInitials name={emp.displayName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                            {emp.displayName}
                          </div>
                          <div className="mt-0.5 text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                            {emp.employeeCode || "-"}
                          </div>
                          <div className="mt-2 flex flex-col gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                            <span className="inline-flex items-center gap-1.5"><Mail size={12} /> {emp.email || "-"}</span>
                            <span className="inline-flex items-center gap-1.5"><Phone size={12} /> {emp.phone || "-"}</span>
                            <span className="inline-flex items-center gap-1.5"><Building2 size={12} /> {emp.department || "-"}</span>
                            <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} /> Joined {formatDate(emp.joinedAt || emp.joinedDate)}</span>
                          </div>
                        </div>
                        <StatusBadge status={currentStatus} />
                      </div>

                      <div className="mt-3 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        Role: {toReadableLabel(String(emp.role ?? "EMPLOYEE"))}
                      </div>
                      <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        Designation: {emp.position || emp.designation || "-"}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="ghost" size="sm" to={`/app/employees/${emp.id}`}>View</Button>
                        {canCreateOrEdit && <Button variant="outline" size="sm" to={`/app/employees/${emp.id}/edit`}>Edit</Button>}
                        {canManageStatus && (
                          <Button
                            variant={currentStatus === "active" ? "danger" : "outline"}
                            size="sm"
                            onClick={() => setStatusTarget({ employee: emp, nextStatus })}
                          >
                            {currentStatus === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                            {currentStatus === "active" ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </SectionCard>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={`${statusTarget?.nextStatus === "inactive" ? "Deactivate" : "Activate"} employee?`}
        description={
          statusTarget
            ? `${statusTarget.nextStatus === "inactive" ? "Deactivate" : "Activate"} ${statusTarget.employee.displayName} (${statusTarget.employee.employeeCode || "no code"}).`
            : ""
        }
        confirmLabel={statusTarget?.nextStatus === "inactive" ? "Deactivate" : "Activate"}
        cancelLabel="Cancel"
        loading={updatingStatus}
        onCancel={() => setStatusTarget(null)}
        onConfirm={handleStatusConfirm}
      />
    </div>
  );
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function toReadableLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
