import { matchPath, useLocation } from "react-router-dom";
import { Logo } from "@/components/common/Logo";
import { useBranding } from "@/features/branding/useBranding";

const quickLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Benefits", href: "#benefits" },
  { label: "Security", href: "#security" },
];

const productLinks = [
  { label: "Sign In", href: "/login" },
  { label: "Register Company", href: "/register-company" },
];

export function Footer() {
  const year = new Date().getFullYear();
  const location = useLocation();
  const { branding } = useBranding();
  const careers = matchPath("/:tenantSlug/careers/*", location.pathname)
    ?? matchPath("/:tenantSlug/careers", location.pathname)
    ?? matchPath("/:tenantSlug/applications/*", location.pathname);

  if (careers) {
    return (
      <footer className="border-t" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:flex-row sm:text-left">
          <div>
            <p className="break-words text-base font-bold" style={{ color: "var(--text-primary)" }}>{branding.companyName}</p>
            <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>A simple, secure hiring experience with {branding.companyName}.</p>
          </div>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Hiring powered by WorkNest · © {year}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t transition-colors duration-200" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)" }}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo size="lg" />
            <p className="mt-4 max-w-md text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              WorkNest is a multi-tenant SaaS platform that helps companies manage employees, teams, projects, tasks, attendance, leave, announcements, and collaboration—all in one workspace.
            </p>
            <div className="mt-6 h-1 w-16 rounded-full" style={{ background: "linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-300) 100%)" }} />
          </div>
          <FooterLinks title="Quick Links" links={quickLinks} />
          <FooterLinks title="Product" links={productLinks} />
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row" style={{ borderColor: "var(--border-default)" }}>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>© {year} WorkNest. All rights reserved. Built for modern teams.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="text-xs no-underline transition-colors hover:text-primary-500" style={{ color: "var(--text-tertiary)" }}>Privacy Policy</a>
            <a href="#" className="text-xs no-underline transition-colors hover:text-primary-500" style={{ color: "var(--text-tertiary)" }}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <h4 className="mb-5 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>{title}</h4>
      <ul className="space-y-3">
        {links.map((link) => <li key={link.label}><a href={link.href} className="text-sm no-underline transition-colors hover:text-primary-500" style={{ color: "var(--text-secondary)" }}>{link.label}</a></li>)}
      </ul>
    </div>
  );
}
