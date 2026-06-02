import type { RecruitmentPipeline } from "@/modules/recruitment/types";
import { RecruitmentStatusBadge } from "@/modules/recruitment/components/RecruitmentStatusBadge";

export function RecruitmentPipelineBoard({ pipeline, onMove }: { pipeline: RecruitmentPipeline; onMove?: (applicationId: string, stage: string) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {pipeline.columns.map((column) => (
        <div key={column.stage} className="rounded-2xl border p-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{column.label}</h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{column.count} application{column.count === 1 ? "" : "s"}</p>
            </div>
            <RecruitmentStatusBadge value={column.stage} />
          </div>

          <div className="space-y-3">
            {column.applications.map((application) => (
              <article key={application.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--bg-muted)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{application.candidate.fullName}</p>
                    <p className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>{application.jobPosition.title}</p>
                  </div>
                  <RecruitmentStatusBadge value={application.status} />
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>Move to</label>
                  <select
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
                    value={application.status}
                    onChange={(event) => onMove?.(application.id, event.target.value)}
                  >
                    <option value={column.stage}>{column.stage}</option>
                    <option value="SCREENING">SCREENING</option>
                    <option value="INTERVIEW">INTERVIEW</option>
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="HR_REVIEW">HR_REVIEW</option>
                    <option value="OFFERED">OFFERED</option>
                    <option value="HIRED">HIRED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}