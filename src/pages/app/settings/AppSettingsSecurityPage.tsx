import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, LogOut, Smartphone, Monitor } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/common/Button";
import {
  getActiveSessionsApi,
  revokeOtherSessionsApi,
  revokeSessionApi,
} from "@/services/api/authApi";
import type { AuthSession } from "@/types";
import { useToast } from "@/hooks/useToast";

export function AppSettingsSecurityPage() {
  usePageMeta({ title: "Security Settings", breadcrumb: ["Workspace", "Settings", "Security"] });

  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<number | "all" | null>(null);
  const toast = useToast();

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const nextSessions = await getActiveSessionsApi();
      setSessions(nextSessions);
    } catch {
      toast.error({ title: "Unable to load sessions", description: "Try again in a moment." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function handleRevokeSession(sessionId: number) {
    setActionPending(sessionId);
    try {
      await revokeSessionApi(sessionId);
      toast.success({ title: "Session revoked", description: "The selected device has been signed out." });
      await loadSessions();
    } catch {
      toast.error({ title: "Could not revoke session", description: "Try again shortly." });
    } finally {
      setActionPending(null);
    }
  }

  async function handleRevokeOthers() {
    setActionPending("all");
    try {
      await revokeOtherSessionsApi();
      toast.success({ title: "Other devices signed out", description: "Only the current session remains active." });
      await loadSessions();
    } catch {
      toast.error({ title: "Could not sign out other devices", description: "Try again shortly." });
    } finally {
      setActionPending(null);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <section className="rounded-2xl border p-6 sm:p-7" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(147,50,234,0.12)", color: "var(--color-primary-600)" }}>
              <ShieldCheck size={14} />
              Session security
            </div>
            <h2 className="mt-3 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Active device sessions
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Review where your account is signed in, revoke a specific device, or sign out of every other browser.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => void loadSessions()} disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => void handleRevokeOthers()} disabled={actionPending === "all"}>
              <LogOut size={16} />
              Log out other devices
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {loading ? (
          <SessionSkeleton />
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-2xl border p-5 sm:p-6"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: session.currentSession ? "rgba(147,50,234,0.35)" : "var(--border-default)" }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: session.currentSession ? "rgba(34,197,94,0.12)" : "rgba(99,102,241,0.10)", color: session.currentSession ? "#16a34a" : "#6366f1" }}>
                      {session.currentSession ? "Current session" : "Active session"}
                    </span>
                    {session.suspicious && (
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(245,158,11,0.12)", color: "#d97706" }}>
                        Suspicious
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl p-2" style={{ background: "rgba(147,50,234,0.08)", color: "var(--color-primary-500)" }}>
                      {session.deviceName?.toLowerCase().includes("mobile") ? <Smartphone size={18} /> : <Monitor size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {session.deviceName ?? "Unknown device"}
                      </div>
                      <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                        {session.ipAddress ?? "Unknown IP"}
                      </div>
                      <div className="mt-1 text-xs break-all" style={{ color: "var(--text-tertiary)" }}>
                        {session.userAgent ?? "No user agent available"}
                      </div>
                      {session.suspiciousReason && (
                        <div className="mt-2 text-xs font-medium" style={{ color: "#d97706" }}>
                          {session.suspiciousReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleRevokeSession(session.id)}
                    disabled={session.currentSession || actionPending === session.id}
                  >
                    <LogOut size={16} />
                    {session.currentSession ? "Current session" : "Revoke"}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function SessionSkeleton() {
  return (
    <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <div className="h-5 w-44 animate-pulse rounded bg-black/8" />
      <div className="mt-4 h-24 animate-pulse rounded-xl bg-black/6" />
      <div className="mt-3 h-24 animate-pulse rounded-xl bg-black/6" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(147,50,234,0.08)", color: "var(--color-primary-500)" }}>
        <ShieldCheck size={22} />
      </div>
      <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        No active sessions
      </h3>
      <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        Sign in from a browser or device to start tracking sessions here.
      </p>
    </div>
  );
}
