import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { AppTopbar } from "@/components/navigation/AppTopbar";
import { NetworkStatusBanner } from "@/components/common/NetworkStatusBanner";
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
        setTitle:      setPageTitle,
        setBreadcrumb: setBreadcrumb,
      }}
    >
      <div
        className="flex h-screen overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(147,50,234,0.04) 0%, rgba(147,50,234,0) 20%), var(--bg-base)",
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

          {/* Page content */}
          <main
            className="flex-1 overflow-y-auto"
            style={{ backgroundColor: "var(--bg-base)" }}
          >
            <div className="mx-auto w-full max-w-[1500px] px-4 py-4 sm:px-6 sm:py-6 xl:px-8 xl:py-8 2xl:px-10">
              <Outlet />
            </div>
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
