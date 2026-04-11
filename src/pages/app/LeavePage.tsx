import { useEffect, useMemo, useState } from "react";
import { PlusCircle, Search } from "lucide-react";
import { FiCheck, FiEdit2, FiEye, FiTrash2, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { cancelLeaveRequest, getLeaveRequests, reviewLeaveRequest } from "@/modules/leave/services/leaveService";
import { LEAVE_TYPE_OPTIONS, type LeaveRequest, type LeaveStatus, type LeaveType } from "@/modules/leave/types";
import { LeaveStatusBadge } from "@/modules/leave/components/LeaveStatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { AppSelect } from "@/components/common/AppSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, ErrorBanner, SkeletonRow } from "@/components/common/AppUI";
import { getErrorMessage } from "@/utils/errorHandler";

const STATUS_OPTIONS: Array<LeaveStatus | "ALL"> = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];
const TYPE_OPTIONS: Array<LeaveType | "ALL"> = ["ALL", ...LEAVE_TYPE_OPTIONS];

function toLabel(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function LeavePage() {
  usePageMeta({ title: "Leave", breadcrumb: ["Workspace", "Leave"] });
  const { user, role } = useAuth();
  const { hasPermission } = usePermission();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<LeaveType | "ALL">("ALL");
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ item: LeaveRequest; status: "APPROVED" | "REJECTED" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const canReview = hasPermission(PERMISSIONS.LEAVE_REVIEW);
  const canApplyLeave = hasPermission(PERMISSIONS.LEAVE_REQUEST) && role !== "TENANT_ADMIN";

  async function fetchLeaves() {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeaveRequests();
      setLeaveRequests(data);
    } catch {
      setError("Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaves();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leaveRequests.filter((item) => {
      const matchesQuery =
        !query ||
        [item.employeeName, item.reason, item.leaveType]
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesType = typeFilter === "ALL" || item.leaveType === typeFilter;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [leaveRequests, search, statusFilter, typeFilter]);

  function isOwner(item: LeaveRequest): boolean {
    if (!user) return false;
    return item.employeeId === user.id || item.employeeName === user.name;
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await cancelLeaveRequest(cancelTarget.id);
      setLeaveRequests((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setFeedback("Leave request cancelled.");
      setCancelTarget(null);
    } catch (actionError: unknown) {
      setFeedback(getErrorMessage(actionError, "Could not cancel leave request."));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReview() {
    if (!reviewTarget) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const updated = await reviewLeaveRequest(reviewTarget.item.id, reviewTarget.status);
      setLeaveRequests((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setFeedback(`Leave request ${reviewTarget.status === "APPROVED" ? "approved" : "rejected"}.`);
      setReviewTarget(null);
    } catch (actionError: unknown) {
      setFeedback(getErrorMessage(actionError, "Could not update leave request."));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description={loading ? "Loading leave requests..." : `${leaveRequests.length} leave request${leaveRequests.length === 1 ? "" : "s"} logged.`}
        actions={canApplyLeave ? (
          <Button variant="primary" to="/app/leave/new">
            <PlusCircle size={16} />
            Apply Leave
          </Button>
        ) : undefined}
      />

      <SectionCard>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by employee, reason, or leave type..."
              className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
            />
          </div>

          <AppSelect
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All Statuses" : toLabel(status)}
              </option>
            ))}
          </AppSelect>

          <AppSelect
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
          >
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type === "ALL" ? "All Types" : toLabel(type)}
              </option>
            ))}
          </AppSelect>
        </div>
      </SectionCard>

      {feedback && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: feedback.toLowerCase().includes("could") || feedback.toLowerCase().includes("only") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
            backgroundColor: feedback.toLowerCase().includes("could") || feedback.toLowerCase().includes("only") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
            color: feedback.toLowerCase().includes("could") || feedback.toLowerCase().includes("only") ? "#ef4444" : "#10b981",
          }}
        >
          {feedback}
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={fetchLeaves} />}

      <SectionCard className="overflow-hidden" contentClassName="p-0" title="Leave Requests" subtitle="Review requests and keep leave schedules organized.">
        <div className="overflow-x-auto">
          <div
            className="hidden min-w-[1040px] md:grid grid-cols-[1.2fr_0.8fr_1fr_1fr_2fr_1fr_1.8fr] gap-3 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)", borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}
          >
            <span>Employee</span>
            <span>Type</span>
            <span>Start</span>
            <span>End</span>
            <span>Reason</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {loading && Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} cols={7} />)}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            title={search || statusFilter !== "ALL" || typeFilter !== "ALL" ? "No matching leave requests" : "No leave requests yet"}
            description={search || statusFilter !== "ALL" || typeFilter !== "ALL" ? "Try adjusting your filters." : "Leave requests submitted by employees will appear here."}
            action={canApplyLeave ? <Button variant="outline" to="/app/leave/new">Apply Leave</Button> : undefined}
          />
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="hidden min-w-[1040px] md:block">
              {filtered.map((item) => {
                const owner = isOwner(item);
                const canEdit = canApplyLeave && owner && item.status === "PENDING";
                const canCancel = canApplyLeave && owner && item.status === "PENDING";
                const canApprove = canReview && item.status === "PENDING";

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.2fr_0.8fr_1fr_1fr_2fr_1fr_1.8fr] items-center gap-3 border-b px-5 py-4"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <span className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.employeeName}</span>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{toLabel(item.leaveType)}</span>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.startDate}</span>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.endDate}</span>
                    <span className="truncate text-sm" style={{ color: "var(--text-secondary)" }}>{item.reason}</span>
                    <LeaveStatusBadge status={item.status} />
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        to={`/app/leave/${item.id}`}
                        title="View leave request"
                        aria-label="View leave request"
                        className="inline-flex items-center justify-center p-1 transition-opacity hover:opacity-80"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <FiEye size={15} />
                      </Link>
                      {canEdit && (
                        <Link
                          to={`/app/leave/${item.id}/edit`}
                          title="Edit leave request"
                          aria-label="Edit leave request"
                          className="inline-flex items-center justify-center p-1 transition-opacity hover:opacity-80"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <FiEdit2 size={15} />
                        </Link>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(item)}
                          title="Cancel leave request"
                          aria-label="Cancel leave request"
                          className="inline-flex items-center justify-center p-1 transition-opacity hover:opacity-80"
                          style={{ color: "#ef4444" }}
                        >
                          <FiTrash2 size={15} />
                        </button>
                      )}
                      {canApprove && (
                        <>
                          <button
                            type="button"
                            onClick={() => setReviewTarget({ item, status: "APPROVED" })}
                            title="Approve leave request"
                            aria-label="Approve leave request"
                            className="inline-flex items-center justify-center p-1 transition-opacity hover:opacity-80"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <FiCheck size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewTarget({ item, status: "REJECTED" })}
                            title="Reject leave request"
                            aria-label="Reject leave request"
                            className="inline-flex items-center justify-center p-1 transition-opacity hover:opacity-80"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <FiX size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {filtered.map((item) => {
                const owner = isOwner(item);
                const canEdit = canApplyLeave && owner && item.status === "PENDING";
                const canCancel = canApplyLeave && owner && item.status === "PENDING";
                const canApprove = canReview && item.status === "PENDING";

                return (
                  <article
                    key={item.id}
                    className="rounded-xl border p-4"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {item.employeeName}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {toLabel(item.leaveType)} · {item.startDate} to {item.endDate}
                    </p>
                    <p className="mt-2 text-xs line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
                      {item.reason}
                    </p>
                    <div className="mt-3">
                      <LeaveStatusBadge status={item.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" to={`/app/leave/${item.id}`}>View</Button>
                      {canEdit && <Button variant="outline" size="sm" to={`/app/leave/${item.id}/edit`}>Edit</Button>}
                      {canCancel && <Button variant="danger" size="sm" onClick={() => setCancelTarget(item)}>Cancel</Button>}
                      {canApprove && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setReviewTarget({ item, status: "APPROVED" })}>Approve</Button>
                          <Button variant="danger" size="sm" onClick={() => setReviewTarget({ item, status: "REJECTED" })}>Reject</Button>
                        </>
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
        open={Boolean(cancelTarget)}
        title="Cancel leave request?"
        description={`This will cancel the leave request for ${cancelTarget?.employeeName ?? "this employee"}.`}
        confirmLabel="Cancel Request"
        loading={actionLoading}
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleCancel}
      />

      <ConfirmDialog
        open={Boolean(reviewTarget)}
        title={reviewTarget?.status === "APPROVED" ? "Approve leave request?" : "Reject leave request?"}
        description={`You are about to ${reviewTarget?.status === "APPROVED" ? "approve" : "reject"} the request for ${reviewTarget?.item.employeeName ?? "this employee"}.`}
        confirmLabel={reviewTarget?.status === "APPROVED" ? "Approve" : "Reject"}
        loading={actionLoading}
        onCancel={() => setReviewTarget(null)}
        onConfirm={handleReview}
      />
    </div>
  );
}
