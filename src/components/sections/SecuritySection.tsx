import { ShieldCheck } from 'lucide-react'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SECURITY_POINTS } from '@/constants/landing'

export function SecuritySection() {
  return (
    <section className="section-shell py-16 sm:py-20">
      <div className="grid items-start gap-10 lg:grid-cols-[0.92fr_1.08fr]">
        <SectionHeader
          badge="Security and Platform Strength"
          title="Built with tenant isolation, role control, and SaaS growth in mind"
          description="The WorkNest foundation keeps operational integrity intact while giving teams room to scale."
          align="left"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {SECURITY_POINTS.map((point) => (
            <article key={point.title} className="rounded-2xl border border-border/80 bg-surface/90 p-5">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
