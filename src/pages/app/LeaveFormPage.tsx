import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { createLeaveRequest, getLeaveRequestById, updateLeaveRequest } from "@/modules/leave/services/leaveService";
import { DEFAULT_LEAVE_FORM, validateLeaveForm } from "@/modules/leave/schemas/leaveForm";
import { LeaveForm } from "@/modules/leave/components/LeaveForm";
import { SectionCard } from "@/components/common/SectionCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/AppUI";
import type { LeaveFormErrors, LeaveFormValues } from "@/modules/leave/types";
import { getErrorMessage } from "@/utils/errorHandler";

export function LeaveFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { user } = useAuth();

  usePageMeta({
    title: isEdit ? "Edit Leave Request" : "Apply Leave",
    breadcrumb: ["Workspace", "Leave", isEdit ? "Edit" : "Create"],
  });

  const [form, setForm] = useState<LeaveFormValues>(DEFAULT_LEAVE_FORM);
  const [errors, setErrors] = useState<LeaveFormErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);

    getLeaveRequestById(id)
      .then((request) => {
        if (!active) return;
        if (user && request.employeeId !== user.id) {
          setFatalError("You can edit only your own leave requests.");
          return;
        }
        if (request.status !== "PENDING") {
          setFatalError("Only pending leave requests can be edited.");
          return;
        }
        setForm({
          leaveType: request.leaveType,
          startDate: request.startDate,
          endDate: request.endDate,
          reason: request.reason,
          attachments: request.attachments,
        });
      })
      .catch(() => {
        if (active) setFatalError("Unable to load leave request.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const title = useMemo(() => (isEdit ? "Update Leave Request" : "Apply for Leave"), [isEdit]);

  async function handleSubmit() {
    if (!user) return;

    setMessage(null);
    const validation = validateLeaveForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      if (id) {
        const latest = await getLeaveRequestById(id);
        if (latest.employeeId !== user.id) {
          throw new Error("You can edit only your own leave requests.");
        }
        if (latest.status !== "PENDING") {
          throw new Error("This leave request is no longer pending and cannot be edited.");
        }
        await updateLeaveRequest(id, form);
        setMessage("Leave request updated successfully.");
      } else {
        await createLeaveRequest({
          employeeId: user.id,
          employeeName: user.name,
          ...form,
        });
        setMessage("Leave request submitted successfully.");
      }
      setTimeout(() => navigate("/app/leave", { replace: true }), 500);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Unable to save leave request."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Submit leave details for manager review and scheduling."
        actions={(
          <Button variant="ghost" onClick={() => navigate("/app/leave")}>
            <ArrowLeft size={16} />
            Back to Leave
          </Button>
        )}
      />

      {loading && (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: "#9332EA", borderLeftColor: "rgba(147,50,234,0.3)" }} />
        </div>
      )}

      {!loading && fatalError && <ErrorBanner message={fatalError} />}

      {!loading && !fatalError && (
        <SectionCard title={isEdit ? "Edit Leave Request" : "New Leave Request"} subtitle="Include accurate dates and a clear reason to speed up approvals.">
          {message && (
            <div
              className="mb-4 rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor: message.toLowerCase().includes("unable") || message.toLowerCase().includes("only") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
                backgroundColor: message.toLowerCase().includes("unable") || message.toLowerCase().includes("only") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
                color: message.toLowerCase().includes("unable") || message.toLowerCase().includes("only") ? "#ef4444" : "#10b981",
              }}
            >
              {message}
            </div>
          )}

          <LeaveForm
            values={form}
            errors={errors}
            submitting={submitting}
            submitLabel={isEdit ? "Save Request" : "Submit Request"}
            onChange={(next) => {
              setForm(next);
              if (Object.keys(errors).length) setErrors({});
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/app/leave")}
          />
        </SectionCard>
      )}
    </div>
  );
}
