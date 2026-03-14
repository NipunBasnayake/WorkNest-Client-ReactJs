import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/common/BrandLogo'
import { NAV_LINKS } from '@/constants/navigation'

export function Footer() {
  return (
    <footer id="contact" className="border-t border-border/70 bg-surface/75">
      <div className="section-shell grid gap-10 py-12 md:grid-cols-[1.3fr_0.7fr_0.7fr] md:gap-8">
        <div className="space-y-4">
          <BrandLogo />
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            WorkNest is a multi-tenant platform that helps companies manage employees, teams, projects,
            tasks, attendance, leave, announcements, and collaboration in one workspace.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Quick links</p>
          <div className="mt-4 grid gap-2">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} className="text-sm text-muted-foreground transition hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Contact</p>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>hello@worknest.app</p>
            <p>+1 (555) 014-2870</p>
            <p>San Francisco, California</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border/70 bg-background/70">
        <p className="section-shell py-4 text-xs text-muted-foreground">
          {new Date().getFullYear()} WorkNest. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
