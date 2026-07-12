import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, id, className = "", rows = 4, required, ...rest }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    const baseTextareaClasses = cn(
      "w-full min-h-24 rounded-xl border bg-[var(--bg-surface)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors duration-200 placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500/35 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50",
      className,
    );

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={textareaId} className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={getDescribedBy(textareaId, hint, error)}
          className={cn(baseTextareaClasses, error && "border-red-400 focus:ring-red-400/35 focus:border-red-400")}
          style={{ borderColor: error ? undefined : "var(--border-default)" }}
          {...rest}
        />
        {hint && !error && (
          <span id={`${textareaId}-hint`} className="text-[11px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
            {hint}
          </span>
        )}
        {error && (
          <span id={`${textareaId}-error`} className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm-.5 2.5a.5.5 0 011 0v3a.5.5 0 01-1 0v-3zm.5 5a.625.625 0 110-1.25A.625.625 0 016 8.5z" />
            </svg>
            {error}
          </span>
        )}
      </div>
    );
  },
);

TextareaField.displayName = "TextareaField";

function getDescribedBy(id: string, hint?: string, error?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
