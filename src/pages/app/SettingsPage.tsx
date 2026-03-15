import { usePageMeta } from "@/hooks/usePageMeta";
import { Settings, Sliders } from "lucide-react";

export function SettingsPage() {
  usePageMeta({ title: "Settings", breadcrumb: ["Workspace", "Settings"] });

  return (
    <div className="max-w-2xl">
      <div
        className="rounded-2xl border p-8 flex flex-col items-center justify-center text-center min-h-[300px]"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(147,50,234,0.08)", border: "1px solid rgba(147,50,234,0.15)", color: "var(--color-primary-500)" }}
        >
          <Sliders size={28} />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Settings
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Workspace configuration options will be available here in Phase 3.
        </p>
        <Settings size={14} className="mt-4 opacity-30" style={{ color: "var(--text-tertiary)" }} />
      </div>
    </div>
  );
}
