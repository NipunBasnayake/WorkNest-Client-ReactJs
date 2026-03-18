import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { AppTopbar } from "@/components/navigation/AppTopbar";
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
        style={{ backgroundColor: "var(--bg-base)" }}
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
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
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
