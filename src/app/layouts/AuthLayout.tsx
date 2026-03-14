import { Outlet, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BrandLogo } from '@/components/common/BrandLogo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="section-shell flex h-20 items-center justify-between gap-3">
        <BrandLogo />
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/80 px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="section-shell pb-14 pt-4 sm:pb-20 sm:pt-6">
        <Outlet />
      </main>
    </div>
  )
}
