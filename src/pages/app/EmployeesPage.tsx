import { useEffect, useState } from "react";
import { Users, Search, Mail, Phone, ChevronRight } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getEmployeesApi } from "@/services/api/employeeApi";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import type { Employee } from "@/types";

const ROLE_COLOR: Record<string, { bg: string; text: string }> = {
  ADMIN:    { bg: "rgba(147,50,234,0.12)",  text: "#9332EA" },
  MANAGER:  { bg: "rgba(124,31,209,0.12)",  text: "#7c1fd1" },
  HR:       { bg: "rgba(168,85,247,0.12)",  text: "#a855f7" },
  EMPLOYEE: { bg: "rgba(99,102,241,0.12)",  text: "#6366f1" },
};

export function EmployeesPage() {
  usePageMeta({ title: "Employees", breadcrumb: ["Workspace", "Employees"] });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [search,    setSearch]    = useState("");

  function fetchEmployees() {
    setLoading(true);
    setError(null);
    getEmployeesApi()
      .then(setEmployees)
      .catch(() => setError("Failed to load employees. Please check your connection and try again."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchEmployees(); }, []);

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      !q ||
      e.name?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Employees
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {loading ? "Loading…" : `${employees.length} team member${employees.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            placeholder="Search employees…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor:     "var(--border-default)",
              color:           "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onRetry={fetchEmployees} />
        </div>
      )}

      {/* Table container */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        {/* Table header */}
        <div
          className="hidden sm:grid grid-cols-[2fr_2fr_1.5fr_1fr_0.5fr] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b"
          style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
        >
          <span>Name</span>
          <span>Email</span>
          <span>Department</span>
          <span>Role</span>
          <span />
        </div>

        {/* Loading skeletons */}
        {loading && (
          Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} cols={5} />
          ))
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={<Users size={28} />}
            title={search ? "No results found" : "No employees yet"}
            description={search ? "Try a different search term." : "Add your first employee to get started."}
          />
        )}

        {/* Rows */}
        {!loading && filtered.map((emp) => {
          const roleStyle = ROLE_COLOR[emp.role?.toUpperCase() ?? ""] ?? ROLE_COLOR.EMPLOYEE;
          const initials = emp.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "??";

          return (
            <div
              key={emp.id}
              className="group flex flex-col sm:grid sm:grid-cols-[2fr_2fr_1.5fr_1fr_0.5fr] gap-2 sm:gap-4 sm:items-center px-5 py-4 border-b transition-colors hover:bg-primary-50/30 dark:hover:bg-primary-950/10 cursor-default"
              style={{ borderColor: "var(--border-default)" }}
            >
              {/* Name + avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)" }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {emp.name ?? "—"}
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      <Phone size={11} />
                      {emp.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail size={13} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
                <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                  {emp.email ?? "—"}
                </span>
              </div>

              {/* Department */}
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {emp.department ?? "—"}
              </div>

              {/* Role badge */}
              <div>
                <span
                  className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: roleStyle.bg, color: roleStyle.text }}
                >
                  {emp.role ?? "—"}
                </span>
              </div>

              {/* Arrow */}
              <div className="hidden sm:flex justify-end">
                <ChevronRight
                  size={16}
                  className="opacity-0 group-hover:opacity-60 transition-opacity"
                  style={{ color: "var(--text-tertiary)" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
