import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { Mail, User, Shield, Building2 } from "lucide-react";

export function ProfilePage() {
  const { user, tenantKey, sessionType } = useAuth();
  const breadcrumb = sessionType === "platform" ? ["Platform", "Profile"] : ["Workspace", "Profile"];
  usePageMeta({ title: "My Profile", breadcrumb });

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <div
        className="rounded-2xl border p-6 sm:p-8"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        {/* Avatar */}
        <div className="flex items-start gap-5 mb-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)" }}
          >
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{user.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(147,50,234,0.12)", color: "var(--color-primary-600)" }}
              >
                {user.role}
              </span>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: sessionType === "platform" ? "rgba(147,50,234,0.08)" : "rgba(99,102,241,0.08)", color: sessionType === "platform" ? "#c084fc" : "#818cf8" }}
              >
                {sessionType === "platform" ? "Platform Session" : "Workspace Session"}
              </span>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoField icon={<User size={16} />}     label="Full Name"  value={user.name} />
          <InfoField icon={<Mail size={16} />}     label="Email"      value={user.email} />
          <InfoField icon={<Shield size={16} />}   label="Role"       value={user.role} />
          {tenantKey && (
            <InfoField icon={<Building2 size={16} />} label="Workspace" value={tenantKey} />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl border"
      style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border-default)" }}
    >
      <span className="mt-0.5 shrink-0" style={{ color: "var(--color-primary-500)" }}>{icon}</span>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </div>
        <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {value ?? "—"}
        </div>
      </div>
    </div>
  );
}
