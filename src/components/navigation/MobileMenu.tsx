import { useEffect } from "react";
import { Button } from "@/components/common/Button";
import { NAV_LINKS } from "@/constants/navigation";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  showNavLinks: boolean;
}

export function MobileMenu({ open, onClose, showNavLinks }: MobileMenuProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`fixed top-16 left-0 right-0 z-40 border-b shadow-xl transition-all duration-300 md:hidden ${
          open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="px-4 py-5 flex flex-col gap-1">
          {showNavLinks &&
            NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors no-underline hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400"
                style={{ color: "var(--text-secondary)" }}
              >
                {link.label}
              </a>
            ))}

          <div
            className="flex flex-col gap-2.5 mt-4 pt-4 border-t"
            style={{ borderColor: "var(--border-default)" }}
          >
            <Button variant="ghost" size="md" to="/login" onClick={onClose}>
              Sign In
            </Button>
            <Button variant="primary" size="md" to="/register-company" onClick={onClose}>
              Get Started Free
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
