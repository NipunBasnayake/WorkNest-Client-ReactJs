import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-soft hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-primary/50',
  secondary:
    'bg-accent text-accent-foreground shadow-soft hover:-translate-y-0.5 hover:bg-accent/90 focus-visible:outline-accent/40',
  outline:
    'border border-border bg-surface/80 text-foreground hover:bg-muted/80 focus-visible:outline-border',
  ghost:
    'bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:outline-border',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-lg px-3 text-sm',
  md: 'h-10 rounded-xl px-5 text-sm',
  lg: 'h-12 rounded-xl px-6 text-base',
}

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonStyleOptions = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )
}
