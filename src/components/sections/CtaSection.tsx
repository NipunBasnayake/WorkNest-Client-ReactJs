import { Link } from 'react-router-dom'
import { buttonStyles } from '@/components/ui/buttonStyles'

export function CtaSection() {
  return (
    <section className="section-shell py-16 sm:py-20">
      <div className="rounded-3xl border border-primary/20 bg-hero-radial bg-primary/95 px-6 py-12 text-primary-foreground shadow-elevated sm:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">Start your workspace</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Bring your company operations into one organized, multi-tenant platform.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
            Create your company workspace in WorkNest and establish a scalable foundation for teams,
            tasks, attendance, and collaboration.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth/register-company"
              className={buttonStyles({ variant: 'secondary', size: 'lg', className: 'bg-white text-slate-900 hover:bg-white/90' })}
            >
              Register Company
            </Link>
            <Link
              to="/auth/login"
              className={buttonStyles({ variant: 'outline', size: 'lg', className: 'border-white/30 bg-white/10 text-white hover:bg-white/20' })}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
