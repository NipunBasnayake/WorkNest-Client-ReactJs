import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/common/SectionHeader'
import { FEATURE_PILLARS } from '@/constants/landing'

export function FeaturesSection() {
  return (
    <section id="features" className="section-shell py-16 sm:py-20">
      <SectionHeader
        badge="Why WorkNest"
        title="A focused foundation for modern workspace operations"
        description="WorkNest gives companies a structured operating layer where workforce, work, and communication stay aligned."
      />

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {FEATURE_PILLARS.map((pillar) => (
          <Card key={pillar.title} hoverable className="h-full">
            <h3 className="font-display text-xl font-semibold text-foreground">{pillar.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
