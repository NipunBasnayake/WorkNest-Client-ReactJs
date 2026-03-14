import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  error?: string
  hint?: string
  containerClassName?: string
}

export function InputField({
  label,
  error,
  hint,
  id,
  className,
  containerClassName,
  required,
  ...props
}: InputFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div className={cn('space-y-2', containerClassName)}>
      <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </label>
      <input
        id={fieldId}
        required={required}
        className={cn(
          'h-11 w-full rounded-xl border border-border bg-background/80 px-4 text-sm text-foreground transition placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25',
          error && 'border-danger focus:border-danger/70 focus:ring-danger/20',
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {hint ? <p id={hintId} className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
