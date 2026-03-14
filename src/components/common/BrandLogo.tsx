import { Link } from 'react-router-dom'
import { APP_NAME } from '@/constants/navigation'
import { cn } from '@/lib/cn'

interface BrandLogoProps {
  className?: string
  to?: string
  compact?: boolean
}

function LogoBody({ compact }: { compact: boolean }) {
  return (
    <>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-indigo-500 to-accent text-sm font-bold text-white shadow-soft">
        W
      </span>
      <span className={cn('font-display text-lg font-semibold tracking-tight text-foreground', compact && 'sr-only')}>
        {APP_NAME}
      </span>
    </>
  )
}

export function BrandLogo({ className, to = '/', compact = false }: BrandLogoProps) {
  if (!to) {
    return (
      <div className={cn('inline-flex items-center gap-3', className)}>
        <LogoBody compact={compact} />
      </div>
    )
  }

  return (
    <Link to={to} className={cn('inline-flex items-center gap-3', className)}>
      <LogoBody compact={compact} />
    </Link>
  )
}
