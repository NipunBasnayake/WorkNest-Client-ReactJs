import { SectionHeader } from '@/components/common/SectionHeader'
import { ROLE_BENEFITS } from '@/constants/landing'

export function RoleBenefitsSection() {
  return (
    <section id="about" className="section-shell py-16 sm:py-20">
      <SectionHeader
        badge="Role-based Benefits"
        title="Value for every role across your organization"
        description="WorkNest is designed so each role gets focused capabilities without adding operational noise."
      />

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ROLE_BENEFITS.map((benefit) => (
          <article key={benefit.role} className="rounded-2xl border border-border/80 bg-surface/90 p-5">
            <h3 className="font-display text-lg font-semibold text-foreground">{benefit.role}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{benefit.summary}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {benefit.points.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
