import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, MessageSquareText, UserCircle2 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { getLeaveRequestById } from "@/modules/leave/services/leaveService";
import { LeaveStatusBadge } from "@/modules/leave/components/LeaveStatusBadge";
import { TENANT_COMMUNICATION_ROLES } from "@/constants/access";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";
import type { LeaveRequest } from "@/modules/leave/types";

function toLabel(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function LeaveDetailPage() {
  const { id } = useParams<{ id: string }>();
  usePageMeta({ title: "Leave Details", breadcrumb: ["Workspace", "Leave", "Details"] });
  const { user, hasRole } = useAuth();

  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const resolvedError = !id ? "Invalid leave request id." : error;

  useEffect(() => {
    if (!id) return;

    let active = true;
    getLeaveRequestById(id)
      .then((response) => {
        if (active) setLeaveRequest(response);
      })
      .catch(() => {
        if (active) setError("Unable to load leave request.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const canEdit =
    leaveRequest &&
    leaveRequest.status === "PENDING" &&
    user &&
    (leaveRequest.employeeId === user.id || leaveRequest.employeeName === user.name || hasRole(...TENANT_COMMUNICATION_ROLES));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" to="/app/leave">
          <ArrowLeft size={16} />
          Back
        </Button>
        {canEdit && <Button variant="outline" to={`/app/leave/${leaveRequest?.id}/edit`}>Edit Request</Button>}
      </div>

      {loading && (
        <div className="py-24 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: "#9332EA", borderLeftColor: "rgba(147,50,234,0.3)" }} />
        </div>
      )}

      {!loading && resolvedError && <ErrorBanner message={resolvedError} />}

      {!loading && !resolvedError && !leaveRequest && (
        <EmptyState
          title="Leave request not found"
          description="The request may no longer exist."
          action={<Button variant="outline" to="/app/leave">Go to Leave</Button>}
        />
      )}

      {!loading && !resolvedError && leaveRequest && (
        <>
          <SectionCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {leaveRequest.employeeName}
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {toLabel(leaveRequest.leaveType)} leave · {leaveRequest.startDate} to {leaveRequest.endDate}
                </p>
              </div>
              <LeaveStatusBadge status={leaveRequest.status} />
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoCard icon={<UserCircle2 size={16} />} label="Employee" value={leaveRequest.employeeName} />
            <InfoCard icon={<CalendarDays size={16} />} label="Start Date" value={leaveRequest.startDate} />
            <InfoCard icon={<CalendarDays size={16} />} label="End Date" value={leaveRequest.endDate} />
          </div>

          <SectionCard title="Reason">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {leaveRequest.reason}
            </p>
          </SectionCard>

          <SectionCard title="Approval Info">
            {leaveRequest.reviewerName ? (
              <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <p>Reviewed by: {leaveRequest.reviewerName}</p>
                <p>Last updated: {new Date(leaveRequest.updatedAt).toLocaleString()}</p>
                <p>Comment: {leaveRequest.reviewComment || "No review comment provided."}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)" }}>
                <MessageSquareText size={18} className="mx-auto mb-2" />
                Approval details will appear after manager review.
              </div>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
        <span style={{ color: "var(--color-primary-500)" }}>{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}
