import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  id: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = "", ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={id}
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-xl px-4 py-2.5 text-sm border transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-400
            placeholder:text-[var(--text-tertiary)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-red-400 focus:ring-red-400/60 focus:border-red-400" : ""}
            ${className}`}
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: error ? undefined : "var(--border-default)",
            color: "var(--text-primary)",
          }}
          {...rest}
        />
        {hint && !error && (
          <span className="text-[11px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
            {hint}
          </span>
        )}
        {error && (
          <span className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm-.5 2.5a.5.5 0 011 0v3a.5.5 0 01-1 0v-3zm.5 5a.625.625 0 110-1.25A.625.625 0 016 8.5z"/>
            </svg>
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
