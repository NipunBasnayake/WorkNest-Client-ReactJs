import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { createTask, getTaskById, updateTask } from "@/modules/tasks/services/taskService";
import { DEFAULT_TASK_FORM, validateTaskForm } from "@/modules/tasks/schemas/taskForm";
import { TaskForm } from "@/modules/tasks/components/TaskForm";
import { getEmployees } from "@/modules/employees/services/employeeService";
import { getEmployeeDisplayName } from "@/modules/employees/utils/employeeMapper";
import { getProjects } from "@/modules/projects/services/projectService";
import { SectionCard } from "@/components/common/SectionCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/AppUI";
import type { TaskFormErrors, TaskFormValues } from "@/modules/tasks/types";

interface Option {
  id: string;
  label: string;
}

export function TaskFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  usePageMeta({
    title: isEdit ? "Edit Task" : "Create Task",
    breadcrumb: ["Workspace", "Tasks", isEdit ? "Edit" : "Create"],
  });

  const [form, setForm] = useState<TaskFormValues>(DEFAULT_TASK_FORM);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [assignees, setAssignees] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getEmployees().catch(() => []), getProjects().catch(() => [])]).then(([employeeRes, projectRes]) => {
      setAssignees(employeeRes.map((employee) => ({ id: employee.id, label: getEmployeeDisplayName(employee) })));
      setProjects(projectRes.map((project) => ({ id: project.id, label: project.name })));
    });
  }, []);

  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);

    getTaskById(id)
      .then((task) => {
        if (!active) return;
        setForm({
          title: task.title,
          description: task.description || "",
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          assigneeId: task.assigneeId || "",
          projectId: task.projectId || "",
        });
      })
      .catch(() => {
        if (active) setFatalError("Unable to load task for editing.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const title = useMemo(() => (isEdit ? "Update Task" : "Create Task"), [isEdit]);

  async function handleSubmit() {
    setMessage(null);
    const validation = validateTaskForm(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    const assignee = assignees.find((item) => item.id === form.assigneeId);
    const project = projects.find((item) => item.id === form.projectId);

    try {
      if (id) {
        await updateTask(id, {
          ...form,
          assigneeId: form.assigneeId || undefined,
          assigneeName: assignee?.label,
          projectId: form.projectId || undefined,
          projectName: project?.label,
        });
        setMessage("Task updated successfully.");
      } else {
        await createTask({
          ...form,
          assigneeId: form.assigneeId || undefined,
          assigneeName: assignee?.label,
          projectId: form.projectId || undefined,
          projectName: project?.label,
        });
        setMessage("Task created successfully.");
      }

      setTimeout(() => navigate("/app/tasks", { replace: true }), 500);
    } catch {
      setMessage("Unable to save task right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Define task scope, owner, and due dates for smoother team execution."
        actions={(
          <Button variant="ghost" onClick={() => navigate("/app/tasks")}>
            <ArrowLeft size={16} />
            Back to Tasks
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
        <SectionCard title={isEdit ? "Edit Task Details" : "New Task"} subtitle="Use clear ownership and due dates to keep execution predictable.">
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

          <TaskForm
            values={form}
            errors={errors}
            assignees={assignees}
            projects={projects}
            submitting={submitting}
            submitLabel={isEdit ? "Save Task" : "Create Task"}
            onChange={(next) => {
              setForm(next);
              if (Object.keys(errors).length) setErrors({});
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/app/tasks")}
          />
        </SectionCard>
      )}
    </div>
  );
}
