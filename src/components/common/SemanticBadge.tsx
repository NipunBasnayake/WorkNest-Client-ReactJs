type SemanticVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface SemanticBadgeProps {
  label: string;
  variant: SemanticVariant;
  showDot?: boolean;
  title?: string;
  className?: string;
}

/**
 * SemanticBadge — Unified status badge component
 *
 * Displays a semantic badge with consistent styling across all modules.
 * Supports 5 semantic variants mapped to calm, professional colors.
 *
 * @example
 * // Status badge with dot
 * <SemanticBadge variant="success" label="Approved" showDot />
 *
 * // Priority badge without dot
 * <SemanticBadge variant="danger" label="Critical" />
 *
 * // With tooltip
 * <SemanticBadge variant="warning" label="Pending" title="Waiting for approval" />
 */
export function SemanticBadge({
  label,
  variant,
  showDot = false,
  title,
  className = '',
}: SemanticBadgeProps) {
  // Semantic color mapping using tokens from src/index.css
  // No purple used for status variants — maintains professional appearance
  const variantStyles: Record<
    SemanticVariant,
    { bg: string; text: string }
  > = {
    // success: green (#22c55e)
    success: {
      bg: 'rgba(34,197,94,0.12)',
      text: '#16a34a',
    },
    // warning: amber (#f59e0b)
    warning: {
      bg: 'rgba(245,158,11,0.12)',
      text: '#d97706',
    },
    // danger: red (#ef4444)
    danger: {
      bg: 'rgba(239,68,68,0.12)',
      text: '#dc2626',
    },
    // info: blue (#3b82f6) — NOT purple
    info: {
      bg: 'rgba(59,130,246,0.12)',
      text: '#2563eb',
    },
    // neutral: slate (#64748b)
    neutral: {
      bg: 'rgba(100,116,139,0.12)',
      text: '#475569',
    },
  };

  const style = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center ${showDot ? 'gap-1.5' : ''} rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
      style={{ background: style.bg, color: style.text }}
      title={title}
    >
      {showDot && (
        <span
          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
          style={{ background: style.text }}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}
