import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { HERO_BADGES, HERO_METRICS } from '@/constants/landing'

export function HeroSection() {
  return (
    <section className="section-shell grid gap-10 py-16 md:py-20 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
      <div className="space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Multi-tenant workspace platform
        </div>

        <div className="space-y-4">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Run your company workspace, teams, and operations from one product.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            WorkNest is a modern multi-tenant platform for employee, project, task, attendance, leave,
            and collaboration management with role-aware control for every workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/auth/register-company" className={buttonStyles({ variant: 'primary', size: 'lg' })}>
            Get Started
          </Link>
          <Link to="/auth/login" className={buttonStyles({ variant: 'outline', size: 'lg' })}>
            Sign In
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          {HERO_BADGES.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/90 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              {badge}
            </span>
          ))}
        </div>
      </div>

      <Card className="relative overflow-hidden border-primary/15 bg-gradient-to-br from-surface via-surface to-primary/5 p-5 sm:p-6">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -left-14 bottom-0 h-36 w-36 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative space-y-5">
          <div className="rounded-xl border border-border/80 bg-background/75 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Workspace Health
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {HERO_METRICS.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-border/70 bg-surface/90 p-3">
                  <p className="text-lg font-semibold text-foreground">{metric.value}</p>
                  <p className="text-[11px] text-muted-foreground">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-background/75 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Task Pipeline</p>
              <span className="rounded-full bg-accent/15 px-2 py-1 text-xs font-medium text-accent">Live</span>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>In progress</span>
                  <span>68%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full w-[68%] rounded-full bg-primary" />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Reviews completed</span>
                  <span>81%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full w-[81%] rounded-full bg-accent" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-background/75 p-4">
              <p className="text-xs text-muted-foreground">Active leave requests</p>
              <p className="mt-2 text-xl font-semibold text-foreground">14</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/75 p-4">
              <p className="text-xs text-muted-foreground">Attendance this week</p>
              <p className="mt-2 text-xl font-semibold text-foreground">96.2%</p>
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}
