import { SectionHeader } from '@/components/common/SectionHeader'
import { HOW_IT_WORKS } from '@/constants/landing'

export function HowItWorksSection() {
  return (
    <section className="section-shell py-16 sm:py-20">
      <SectionHeader
        badge="How It Works"
        title="Launch and operationalize your workspace in a clear flow"
        description="Set up WorkNest in stages and move from onboarding to execution without unnecessary complexity."
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-4">
        {HOW_IT_WORKS.map((step, index) => (
          <article key={step.title} className="rounded-2xl border border-border/80 bg-surface/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Step {index + 1}</p>
            <h3 className="mt-3 text-lg font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
