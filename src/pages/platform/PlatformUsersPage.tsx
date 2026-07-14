import { useMemo, useState } from "react";
import { Clock3, KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { usePlatformUsersQuery } from "@/hooks/queries/usePlatformQueries";
import { EmptyState, ErrorState } from "@/components/common/AsyncStates";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchField } from "@/components/common/SearchField";
import { SectionCard } from "@/components/common/SectionCard";
import { SkeletonRow, StatCard } from "@/components/common/AppUI";
import { getErrorMessage } from "@/utils/errorHandler";
import { formatDate, formatRelativeTime, toReadableLabel } from "@/utils/formatting";

export function PlatformUsersPage() {
  usePageMeta({ title: "Platform Users", breadcrumb: ["Platform", "Users"] });
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const { data: users = [], error, isLoading, refetch } = usePlatformUsersQuery(true);
  const tenantFilter = params.get("tenant")?.toLowerCase();
  const errorMessage = error ? getErrorMessage(error, "Unable to load platform users.") : null;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery = !query || [user.fullName, user.email, user.tenantKey, user.companyName, user.role]
        .some((value) => String(value ?? "").toLowerCase().includes(query));
      return matchesQuery && (role === "ALL" || user.role === role) && (status === "ALL" || user.status === status)
        && (!tenantFilter || user.tenantKey?.toLowerCase() === tenantFilter);
    });
  }, [role, search, status, tenantFilter, users]);

  const roles = useMemo(() => [...new Set(users.map((user) => user.role))].sort(), [users]);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const activeUsers = users.filter((user) => user.status === "ACTIVE").length;
  const newThisMonth = users.filter((user) => user.createdAt?.slice(0, 7) === currentMonth).length;
  const activeSessions = users.reduce((total, user) => total + user.activeSessions, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Users" description="Platform-wide identities, tenant membership, role distribution, and sign-in recency." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={users.length} icon={<Users size={19} />} accentColor="#9332ea" />
        <StatCard label="Active users" value={activeUsers} icon={<ShieldCheck size={19} />} accentColor="#059669" />
        <StatCard label="New this month" value={newThisMonth} icon={<UserPlus size={19} />} accentColor="#2563eb" />
        <StatCard label="Active sessions" value={activeSessions} icon={<Clock3 size={19} />} accentColor="#d97706" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <SearchField label="Search users" placeholder="Name, email, company, tenant..." value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} className="w-full lg:flex-1" />
        <FilterSelect label="Role" value={role} onChange={setRole} options={["ALL", ...roles]} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={["ALL", "ACTIVE", "INACTIVE"]} />
      </div>

      {errorMessage ? <ErrorState message={errorMessage} onRetry={() => void refetch()} /> : null}
      <SectionCard variant="table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead><tr className="border-b text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border-default)", background: "var(--bg-muted)", color: "var(--text-tertiary)" }}>
              <th className="px-5 py-3">User</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Last login</th><th className="px-4 py-3">Sessions</th><th className="px-5 py-3">Status</th>
            </tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={6}>{Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} cols={6} />)}</td></tr> : null}
              {!isLoading && !errorMessage ? filtered.map((user) => (
                <tr key={user.id} className="border-b" style={{ borderColor: "var(--border-default)" }}>
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-600">{initials(user.fullName)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{user.fullName}</p><p className="truncate text-xs" style={{ color: "var(--text-tertiary)" }}>{user.email}</p></div></div></td>
                  <td className="px-4 py-4"><p className="max-w-48 truncate text-sm" style={{ color: "var(--text-primary)" }}>{user.companyName ?? "WorkNest Platform"}</p><p className="mt-0.5 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{user.tenantKey ?? "platform"}</p></td>
                  <td className="px-4 py-4"><span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600">{toReadableLabel(user.role)}</span></td>
                  <td className="px-4 py-4"><p className="text-sm" style={{ color: "var(--text-primary)" }}>{formatRelativeTime(user.lastLoginAt)}</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>Joined {formatDate(user.createdAt)}</p></td>
                  <td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}><KeyRound size={14} />{user.activeSessions}</span></td>
                  <td className="px-5 py-4"><UserStatusBadge status={user.status} /></td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
        {!isLoading && !errorMessage && filtered.length === 0 ? <EmptyState icon={<Users size={28} />} title="No matching users" description="Adjust the search or filters to find a platform identity." /> : null}
        {!isLoading && !errorMessage && filtered.length > 0 ? <div className="border-t px-5 py-3 text-xs" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>Showing {filtered.length} of {users.length} identities</div> : null}
      </SectionCard>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="block min-w-44"><span className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border px-3 text-sm" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}>{options.map((option) => <option key={option} value={option}>{option === "ALL" ? `All ${label.toLowerCase()}s` : toReadableLabel(option)}</option>)}</select></label>;
}

function UserStatusBadge({ status }: { status: string }) {
  const active = status === "ACTIVE";
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: active ? "#059669" : "#64748b", background: active ? "#05966914" : "#64748b14" }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: active ? "#059669" : "#64748b" }} />{toReadableLabel(status)}</span>;
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}
