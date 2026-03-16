import { useEffect, useMemo, useState } from "react";
import { Building2, Mail, Phone, Search, Trash2, UserPlus, Users } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { deleteEmployee, getEmployees } from "@/modules/employees/services/employeeService";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { AvatarInitials } from "@/components/common/AvatarInitials";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { toEmployeeViewModel } from "@/modules/employees/utils/employeeMapper";
import type { EmployeeViewModel } from "@/modules/employees/types";

export function EmployeesPage() {
  usePageMeta({ title: "Employees", breadcrumb: ["Workspace", "Employees"] });

  const [employees, setEmployees] = useState<EmployeeViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<EmployeeViewModel | null>(null);
  const [deleting, setDeleting] = useState(false);

  function fetchEmployees() {
    setLoading(true);
    setError(null);
    getEmployees()
      .then((data) => setEmployees(data.map(toEmployeeViewModel)))
      .catch(() => setError("Failed to load employees. Please check your connection and try again."))
      .finally(() => setLoading(false));
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
    const q = search.trim().toLowerCase();
    return employees.filter((emp) => {
      const matchesSearch = !q || [
        emp.displayName,
        emp.email,
        emp.phone,
        emp.position,
        emp.department,
      ].some((value) => value?.toLowerCase().includes(q));

      const matchesDepartment = department === "all" || (emp.department ?? "").toLowerCase() === department.toLowerCase();

      return matchesSearch && matchesDepartment;
    });
  }, [department, employees, search]);

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setDeleting(true);
    setFeedback(null);

    try {
      await deleteEmployee(deleteTarget.id);
      setEmployees((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setFeedback("Employee removed successfully.");
      setDeleteTarget(null);
    } catch {
      setFeedback("Unable to delete employee. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Management"
        description={loading ? "Loading employee roster..." : `${employees.length} employee record${employees.length === 1 ? "" : "s"} found.`}
        actions={(
          <Button variant="primary" to="/app/employees/new">
            <UserPlus size={16} />
            Add Employee
          </Button>
        )}
      />

      <SectionCard>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
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
              placeholder="Search by name, email, position, department..."
              className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
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
        <div
          className="hidden md:grid grid-cols-[2.2fr_1.8fr_1.2fr_1.2fr_1fr_0.9fr_1.4fr] gap-3 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
        >
          <span>Name</span>
          <span>Email</span>
          <span>Phone</span>
          <span>Position</span>
          <span>Department</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {loading && Array.from({ length: 6 }).map((_, idx) => <SkeletonRow key={idx} cols={7} />)}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={<Users size={28} />}
            title={search || department !== "all" ? "No matching employees" : "No employees yet"}
            description={search || department !== "all" ? "Adjust the search or department filter." : "Add your first employee record to start managing your workforce."}
            action={<Button variant="outline" to="/app/employees/new">Create Employee</Button>}
          />
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="hidden md:block">
              {filtered.map((emp) => (
                <div
                  key={emp.id}
                  className="grid grid-cols-[2.2fr_1.8fr_1.2fr_1.2fr_1fr_0.9fr_1.4fr] items-center gap-3 border-b px-5 py-4"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarInitials name={emp.displayName} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {emp.displayName}
                      </div>
                      <div className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {emp.role ?? "Employee"}
                      </div>
                    </div>
                  </div>
                  <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>{emp.email || "—"}</span>
                  <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>{emp.phone || "—"}</span>
                  <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>{emp.position || "—"}</span>
                  <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>{emp.department || "—"}</span>
                  <StatusBadge status={emp.status ?? "active"} />
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="sm" to={`/app/employees/${emp.id}`}>View</Button>
                    <Button variant="outline" size="sm" to={`/app/employees/${emp.id}/edit`}>Edit</Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteTarget(emp)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {filtered.map((emp) => (
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
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <Building2 size={12} />
                        {emp.department || "No department"}
                      </div>
                      <div className="mt-1 flex flex-col gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                        <span className="inline-flex items-center gap-1.5"><Mail size={12} /> {emp.email || "—"}</span>
                        <span className="inline-flex items-center gap-1.5"><Phone size={12} /> {emp.phone || "—"}</span>
                      </div>
                    </div>
                    <StatusBadge status={emp.status ?? "active"} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" to={`/app/employees/${emp.id}`}>View</Button>
                    <Button variant="outline" size="sm" to={`/app/employees/${emp.id}/edit`}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(emp)}>
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete employee?"
        description={`This will permanently remove ${deleteTarget?.displayName ?? "this employee"} from your workspace records.`}
        confirmLabel="Delete Employee"
        cancelLabel="Keep Employee"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
