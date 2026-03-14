import { cn } from '@/lib/cn'

interface SectionHeaderProps {
  badge?: string
  title: string
  description: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeader({
  badge,
  title,
  description,
  align = 'center',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('space-y-4', align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl', className)}>
      {badge ? (
        <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {badge}
        </p>
      ) : null}
      <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h2>
      <p className="text-base text-muted-foreground sm:text-lg">{description}</p>
    </div>
  )
}
