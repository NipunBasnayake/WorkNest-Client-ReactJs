import { useState, useEffect } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/common/Button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { NAV_LINKS } from "@/constants/navigation";
import { useBranding } from "@/features/branding/useBranding";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { branding } = useBranding();
  const isLanding = location.pathname === "/";
  const careersMatch = matchPath("/:tenantSlug/careers/*", location.pathname)
    ?? matchPath("/:tenantSlug/careers", location.pathname)
    ?? matchPath("/:tenantSlug/applications/*", location.pathname);
  const tenantCareersLink = careersMatch?.params.tenantSlug
    ? [{ label: "Careers", href: `/${careersMatch.params.tenantSlug}/careers` }]
    : [];
  const visibleNavLinks = isLanding ? NAV_LINKS : tenantCareersLink;
  const isCareers = Boolean(careersMatch);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled
            ? "var(--bg-navbar)"
            : "transparent",
          backdropFilter: scrolled ? "var(--navbar-blur)" : "none",
          WebkitBackdropFilter: scrolled ? "var(--navbar-blur)" : "none",
          borderBottom: scrolled ? "1px solid var(--border-default)" : "1px solid transparent",
        }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          {isCareers && careersMatch?.params.tenantSlug ? (
            <Link to={`/${careersMatch.params.tenantSlug}/careers`} className="min-w-0 break-words text-lg font-bold text-[var(--text-primary)] no-underline">
              {branding.companyName}
            </Link>
          ) : <Logo size="md" />}

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {visibleNavLinks.map((link) => (
              link.href.startsWith("/") ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 no-underline hover:text-primary-600 dark:hover:text-primary-400"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 no-underline hover:text-primary-600 dark:hover:text-primary-400"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {link.label}
                </a>
              )
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {!isCareers ? <><Button variant="ghost" size="sm" to="/login">Sign In</Button><Button variant="primary" size="sm" to="/register-company" className="shadow-md shadow-primary-500/25">Get Started</Button></> : null}
          </div>

          {/* Mobile toggle */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-950/30"
              style={{ color: "var(--text-primary)" }}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile overlay menu */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navLinks={visibleNavLinks}
      />
    </>
  );
}
