import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { buttonStyles } from '@/components/ui/buttonStyles'

export function NotFoundPage() {
  return (
    <section className="section-shell flex min-h-[65vh] items-center justify-center py-16">
      <div className="max-w-xl rounded-3xl border border-border/80 bg-surface/95 p-8 text-center shadow-soft sm:p-10">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <AlertCircle className="h-6 w-6" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">404 error</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">Page not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          The page you are looking for does not exist or has moved. Return to WorkNest home to continue.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className={buttonStyles({ variant: 'primary' })}>
            Back to Home
          </Link>
          <Link to="/auth/login" className={buttonStyles({ variant: 'outline' })}>
            Go to Sign In
          </Link>
        </div>
      </div>
    </section>
  )
}
