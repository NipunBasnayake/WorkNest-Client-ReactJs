import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import type { NavLink } from "@/types";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  navLinks: NavLink[];
}

export function MobileMenu({ open, onClose, navLinks }: MobileMenuProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 opacity-100 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed top-16 left-0 right-0 z-40 translate-y-0 border-b opacity-100 shadow-xl transition-all duration-300 md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="px-4 py-5 flex flex-col gap-1">
          {navLinks.map((link) => (
            link.href.startsWith("/") ? (
              <Link
                key={link.href}
                to={link.href}
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors no-underline hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400"
                style={{ color: "var(--text-secondary)" }}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors no-underline hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400"
                style={{ color: "var(--text-secondary)" }}
              >
                {link.label}
              </a>
            )
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
