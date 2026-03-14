import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/common/SectionHeader'
import { MODULE_FEATURES } from '@/constants/landing'

export function ModulesSection() {
  return (
    <section id="modules" className="section-shell py-16 sm:py-20">
      <SectionHeader
        badge="Core Modules"
        title="Everything teams need to execute and operate"
        description="Build consistent operations across departments with modules designed for growing organizations."
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MODULE_FEATURES.map((feature) => {
          const Icon = feature.icon

          return (
            <Card key={feature.title} hoverable className="h-full p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
