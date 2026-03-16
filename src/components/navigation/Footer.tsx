import { Logo } from "@/components/common/Logo";

const quickLinks = [
  { label: "Features",     href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Benefits",     href: "#benefits" },
  { label: "Security",     href: "#security" },
];

const productLinks = [
  { label: "Sign In",           href: "/login" },
  { label: "Register Company",  href: "/register-company" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t transition-colors duration-200"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="lg" />
            <p
              className="mt-4 text-sm max-w-md leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              WorkNest is a multi-tenant SaaS platform that helps companies
              manage employees, teams, projects, tasks, attendance, leave,
              announcements, and collaboration — all in one workspace.
            </p>

            {/* Brand accent stripe */}
            <div
              className="mt-6 h-1 w-16 rounded-full"
              style={{
                background: "linear-gradient(135deg, #9332EA 0%, #c084fc 100%)",
              }}
            />
          </div>

          {/* Quick Links */}
          <div>
            <h4
              className="text-xs font-bold mb-5 uppercase tracking-widest"
              style={{ color: "var(--text-tertiary)" }}
            >
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm no-underline transition-colors hover:text-primary-500 dark:hover:text-primary-400"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4
              className="text-xs font-bold mb-5 uppercase tracking-widest"
              style={{ color: "var(--text-tertiary)" }}
            >
              Product
            </h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm no-underline transition-colors hover:text-primary-500 dark:hover:text-primary-400"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            &copy; {year} WorkNest. All rights reserved. Built for modern teams.
          </p>
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="text-xs no-underline transition-colors hover:text-primary-500 dark:hover:text-primary-400"
              style={{ color: "var(--text-tertiary)" }}
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-xs no-underline transition-colors hover:text-primary-500 dark:hover:text-primary-400"
              style={{ color: "var(--text-tertiary)" }}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
