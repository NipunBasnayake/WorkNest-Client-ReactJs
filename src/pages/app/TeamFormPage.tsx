import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { createTeam, getTeamById, updateTeam } from "@/modules/teams/services/teamService";
import { getEmployees } from "@/modules/employees/services/employeeService";
import { getEmployeeDisplayName } from "@/modules/employees/utils/employeeMapper";
import { DEFAULT_TEAM_FORM, validateTeamForm } from "@/modules/teams/schemas/teamForm";
import { TeamForm } from "@/modules/teams/components/TeamForm";
import { SectionCard } from "@/components/common/SectionCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/AppUI";
import type { TeamFormErrors, TeamFormValues } from "@/modules/teams/types";
import type { Employee } from "@/types";

interface EmployeeOption {
  id: string;
  name: string;
}

export function TeamFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  usePageMeta({
    title: isEdit ? "Edit Team" : "Create Team",
    breadcrumb: ["Workspace", "Teams", isEdit ? "Edit" : "Create"],
  });

  const [form, setForm] = useState<TeamFormValues>(DEFAULT_TEAM_FORM);
  const [errors, setErrors] = useState<TeamFormErrors>({});
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    getEmployees()
      .then((employees) => {
        const options = employees.map((emp: Employee) => ({
          id: emp.id,
          name: getEmployeeDisplayName(emp),
        }));
        setEmployeeOptions(options);
      })
      .catch(() => setEmployeeOptions([]));
  }, []);

  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);

    getTeamById(id)
      .then((team) => {
        if (!active) return;
        setForm({
          name: team.name,
          description: team.description ?? "",
          managerName: team.managerName,
          managerEmployeeId: team.managerEmployeeId ?? "",
          memberIds: team.memberIds,
          status: team.status,
        });
      })
      .catch(() => {
        if (active) setFatalError("Unable to load team for editing.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const title = useMemo(() => (isEdit ? "Update Team" : "Create Team"), [isEdit]);

  async function handleSubmit() {
    setMessage(null);
    const validation = validateTeamForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      if (id) {
        await updateTeam(id, form);
        setMessage("Team updated successfully.");
      } else {
        await createTeam(form);
        setMessage("Team created successfully.");
      }

      setTimeout(() => navigate("/app/teams", { replace: true }), 500);
    } catch {
      setMessage("Unable to save team right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Configure team structure, manager ownership, and membership."
        actions={(
          <Button variant="ghost" onClick={() => navigate("/app/teams")}>
            <ArrowLeft size={16} />
            Back to Teams
          </Button>
        )}
      />

      {loading && (
        <div className="py-20 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-transparent animate-spin"
            style={{ borderTopColor: "#9332EA", borderLeftColor: "rgba(147,50,234,0.3)" }}
          />
        </div>
      )}

      {!loading && fatalError && <ErrorBanner message={fatalError} />}

      {!loading && !fatalError && (
        <SectionCard title={isEdit ? "Edit Team Details" : "New Team"} subtitle="Use member assignments to maintain clear ownership.">
          {message && (
            <div
              className="mb-4 rounded-xl border px-4 py-3 text-sm"
              style={{
                borderColor: message.toLowerCase().includes("unable") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)",
                backgroundColor: message.toLowerCase().includes("unable") ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.08)",
                color: message.toLowerCase().includes("unable") ? "#ef4444" : "#10b981",
              }}
            >
              {message}
            </div>
          )}

          <TeamForm
            values={form}
            errors={errors}
            employeeOptions={employeeOptions}
            submitting={submitting}
            submitLabel={isEdit ? "Save Team" : "Create Team"}
            onChange={(next) => {
              setForm(next);
              if (Object.keys(errors).length) setErrors({});
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/app/teams")}
          />
        </SectionCard>
      )}
    </div>
  );
}
