import { VALUE_HIGHLIGHTS } from '@/constants/landing'

export function ValueHighlightsStrip() {
  return (
    <section className="section-shell py-6 sm:py-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {VALUE_HIGHLIGHTS.map((highlight) => (
          <article
            key={highlight.title}
            className="rounded-xl border border-border/80 bg-surface/90 p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
          >
            <h3 className="text-sm font-semibold text-foreground">{highlight.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{highlight.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
