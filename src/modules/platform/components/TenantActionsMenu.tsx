import { useState } from "react";
import { Archive, BarChart3, FileClock, FileText, KeyRound, MoreHorizontal, Pencil, RefreshCw, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Input } from "@/components/common/Input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type PlatformTenantAdminAction,
  usePlatformTenantAdminActionMutation,
  usePlatformTenantCompanyMutation,
} from "@/hooks/queries/usePlatformQueries";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/utils/errorHandler";
import type { PlatformTenantStatus, Tenant } from "@/types";
import { TenantStatusDialog } from "@/modules/platform/components/TenantStatusDialog";

interface Props {
  tenant: Tenant;
  buttonLabel?: string;
}

const adminActionCopy: Record<PlatformTenantAdminAction, { title: string; description: string; confirm: string; success: string }> = {
  "reset-password": {
    title: "Reset tenant admin password?",
    description: "A secure temporary password will be emailed to the company administrator. Existing sessions will be revoked and a password change will be required at the next sign-in.",
    confirm: "Reset and email password",
    success: "Tenant admin password reset",
  },
  unlock: {
    title: "Unlock tenant administrator?",
    description: "The identifier-based login throttle will be cleared for this tenant administrator.",
    confirm: "Unlock account",
    success: "Tenant admin account unlocked",
  },
  "resend-welcome": {
    title: "Resend welcome credentials?",
    description: "A new temporary password will replace the original credential and will be emailed to the administrator. This is only available before their first login.",
    confirm: "Resend credentials",
    success: "Welcome credentials resent",
  },
};

export function TenantActionsMenu({ tenant, buttonLabel }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const [statusOpen, setStatusOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<PlatformTenantStatus>();
  const [editOpen, setEditOpen] = useState(false);
  const [companyName, setCompanyName] = useState(tenant.companyName);
  const [adminAction, setAdminAction] = useState<PlatformTenantAdminAction>();
  const companyMutation = usePlatformTenantCompanyMutation();
  const adminMutation = usePlatformTenantAdminActionMutation();
  const currentStatus = String(tenant.status ?? "ACTIVE").toUpperCase();

  function openLifecycle(status?: PlatformTenantStatus) {
    setInitialStatus(status);
    setStatusOpen(true);
  }

  async function saveCompany() {
    const nextName = companyName.trim();
    if (!nextName || nextName === tenant.companyName) return;
    try {
      await companyMutation.mutateAsync({ tenantKey: tenant.tenantKey, companyName: nextName });
      toast.success({ title: "Company information updated" });
      setEditOpen(false);
    } catch (error) {
      toast.error({ title: "Company information was not updated", description: getErrorMessage(error, "Please try again.") });
    }
  }

  async function runAdminAction() {
    if (!adminAction) return;
    try {
      await adminMutation.mutateAsync({ tenantKey: tenant.tenantKey, action: adminAction });
      toast.success({ title: adminActionCopy[adminAction].success });
      setAdminAction(undefined);
    } catch (error) {
      toast.error({ title: "Tenant admin action failed", description: getErrorMessage(error, "Please try again.") });
    }
  }

  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size={buttonLabel ? "sm" : "icon"} aria-label={`Actions for ${tenant.companyName}`}>
          <MoreHorizontal size={17} />{buttonLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Tenant operations</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => navigate(`/platform/tenants/${tenant.tenantKey}`)}><FileText size={16} />View details</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { setCompanyName(tenant.companyName); setEditOpen(true); }}><Pencil size={16} />Edit company information</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openLifecycle()}><RefreshCw size={16} />Manage lifecycle</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate(`/platform/analytics?tenant=${encodeURIComponent(tenant.tenantKey)}`)}><BarChart3 size={16} />View analytics</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate(`/platform/audit-logs?tenant=${encodeURIComponent(tenant.tenantKey)}`)}><FileClock size={16} />View audit logs</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate(`/platform/reports?tenant=${encodeURIComponent(tenant.tenantKey)}`)}><FileText size={16} />Open reports</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setAdminAction("unlock")}><UserRoundCheck size={16} />Unlock tenant admin</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setAdminAction("reset-password")}><KeyRound size={16} />Reset admin password</DropdownMenuItem>
        <DropdownMenuItem disabled={Boolean(tenant.lastLoginAt)} onSelect={() => setAdminAction("resend-welcome")}><ShieldCheck size={16} />Resend welcome credentials</DropdownMenuItem>
        {currentStatus !== "ARCHIVED" ? <>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onSelect={() => openLifecycle("ARCHIVED")}><Archive size={16} />Archive tenant (soft delete)</DropdownMenuItem>
        </> : null}
      </DropdownMenuContent>
    </DropdownMenu>

    {statusOpen ? <TenantStatusDialog tenant={tenant} open initialStatus={initialStatus} onClose={() => setStatusOpen(false)} /> : null}

    {editOpen ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button aria-label="Close company editor" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
        <section role="dialog" aria-modal="true" aria-labelledby="company-editor-title" className="relative z-10 w-full max-w-lg rounded-2xl border p-6 shadow-2xl" style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
          <h2 id="company-editor-title" className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Edit company information</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Update the display name for {tenant.tenantKey}. The immutable tenant key and database are not changed.</p>
          <div className="mt-5"><Input id={`company-${tenant.tenantKey}`} label="Company name" value={companyName} maxLength={255} onChange={(event) => setCompanyName(event.target.value)} /></div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={companyMutation.isPending}>Cancel</Button>
            <Button onClick={() => void saveCompany()} loading={companyMutation.isPending} disabled={!companyName.trim() || companyName.trim() === tenant.companyName}>Save changes</Button>
          </div>
        </section>
      </div>
    ) : null}

    <ConfirmDialog
      open={Boolean(adminAction)}
      title={adminAction ? adminActionCopy[adminAction].title : ""}
      description={adminAction ? adminActionCopy[adminAction].description : ""}
      confirmLabel={adminAction ? adminActionCopy[adminAction].confirm : "Confirm"}
      loading={adminMutation.isPending}
      onCancel={() => setAdminAction(undefined)}
      onConfirm={() => void runAdminAction()}
    />
  </>;
}
