import { useState, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { AppTopbar } from "@/components/navigation/AppTopbar";

/* ── Page context — lets child pages set their title & breadcrumb ── */
interface PageContextValue {
  setTitle:      (title: string)       => void;
  setBreadcrumb: (crumbs: string[])    => void;
}
export const PageContext = createContext<PageContextValue>({
  setTitle:      () => {},
  setBreadcrumb: () => {},
});
export const usePage = () => useContext(PageContext);

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
