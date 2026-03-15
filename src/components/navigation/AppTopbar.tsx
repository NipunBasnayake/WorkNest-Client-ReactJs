import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

interface AppTopbarProps {
  pageTitle: string;
  breadcrumb?: string[];
  onMobileMenuToggle: () => void;
}

export function AppTopbar({ pageTitle, breadcrumb, onMobileMenuToggle }: AppTopbarProps) {
  const { user } = useAuth();

  return (
    <header
      className="h-16 flex items-center gap-4 px-4 sm:px-6 border-b shrink-0 transition-colors duration-200"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor:     "var(--border-default)",
      }}
    >
      {/* Mobile menu trigger */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 rounded-lg cursor-pointer transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/20"
        style={{ color: "var(--text-secondary)" }}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Page title + breadcrumb */}
      <div className="flex-1 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5 mb-0.5">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span style={{ color: "var(--text-tertiary)" }} className="text-xs">/</span>
                )}
                <span
                  className="text-xs"
                  style={{ color: i < breadcrumb.length - 1 ? "var(--text-tertiary)" : "var(--text-secondary)" }}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        )}
        <h1
          className="text-base font-semibold truncate leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <ThemeToggle />

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-default"
              style={{
                background: "linear-gradient(135deg, #9332EA 0%, #7c1fd1 100%)",
              }}
              title={user.name}
            >
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
