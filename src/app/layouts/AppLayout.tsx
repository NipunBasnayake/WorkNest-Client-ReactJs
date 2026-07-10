import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { AppTopbar } from "@/components/navigation/AppTopbar";
import { NetworkStatusBanner } from "@/components/common/NetworkStatusBanner";
import { PageContainer } from "@/components/common/PageContainer";
import { PageContext } from "@/app/layouts/PageMetaContext";

/* ── Layout ── */
interface AppLayoutProps {
  area: "tenant" | "platform";
}

export function AppLayout({ area }: AppLayoutProps) {
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [pageTitle,   setPageTitle]   = useState("Dashboard");
  const [breadcrumb,  setBreadcrumb]  = useState<string[]>([]);

  return (
    <PageContext.Provider
      value={{
        setTitle: setPageTitle,
        setBreadcrumb: setBreadcrumb,
      }}
    >
      <div
        className="flex h-dvh overflow-hidden"
        style={{
          background: "var(--bg-base)",
        }}
      >
        {/* Sidebar */}
        <AppSidebar
          area={area}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Main content */}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <NetworkStatusBanner />
          <AppTopbar
            area={area}
            pageTitle={pageTitle}
            breadcrumb={breadcrumb}
            onMobileMenuToggle={() => setMobileOpen(true)}
          />

          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ backgroundColor: "var(--bg-base)" }}>
            <PageContainer>
              <Outlet />
            </PageContainer>
          </main>
        </div>
      </div>
    </PageContext.Provider>
  );
}

/* ── Convenience exports ── */
export function TenantLayout() {
  return <AppLayout area="tenant" />;
}

export function PlatformLayout() {
  return <AppLayout area="platform" />;
}
