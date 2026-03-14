import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export function Card({ className, hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/80 bg-surface/95 p-6 shadow-soft backdrop-blur',
        hoverable && 'transition-transform duration-200 hover:-translate-y-1 hover:shadow-elevated',
        className,
      )}
      {...props}
    />
  )
}
