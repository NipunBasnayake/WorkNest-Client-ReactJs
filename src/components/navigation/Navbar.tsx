import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NAV_LINKS } from '@/constants/navigation'
import { cn } from '@/lib/cn'

const navLinkClass =
  'text-sm font-medium text-muted-foreground transition hover:text-foreground'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="section-shell flex h-16 items-center justify-between gap-4">
        <BrandLogo />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} to={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link to="/auth/login" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
            Sign In
          </Link>
          <Link to="/auth/register-company" className={buttonStyles({ variant: 'primary', size: 'sm' })}>
            Get Started
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/90 text-muted-foreground transition hover:text-foreground"
            onClick={() => setIsOpen((open) => !open)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          'md:hidden',
          isOpen ? 'border-t border-border/80 bg-background/95' : 'pointer-events-none h-0 overflow-hidden',
        )}
      >
        <div className="section-shell space-y-3 py-4">
          <nav className="grid gap-2" aria-label="Mobile primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="grid gap-2 pt-2">
            <Link to="/auth/login" className={buttonStyles({ variant: 'outline' })} onClick={() => setIsOpen(false)}>
              Sign In
            </Link>
            <Link
              to="/auth/register-company"
              className={buttonStyles({ variant: 'primary' })}
              onClick={() => setIsOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
