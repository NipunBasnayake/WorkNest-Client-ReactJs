import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  id: string;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, endAdornment, className = "", ...rest }, ref) => {
    const baseInputClasses = `w-full rounded-xl px-4 py-2.5 text-sm border transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-400
      placeholder:text-[var(--text-tertiary)]
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}`;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={id}
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
        {endAdornment ? (
          <div
            className={`flex items-stretch overflow-hidden rounded-xl border transition-all duration-200 focus-within:ring-2 focus-within:ring-primary-500/60 focus-within:border-primary-400 ${
              error ? "border-red-400 focus-within:ring-red-400/60 focus-within:border-red-400" : ""
            }`}
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: error ? undefined : "var(--border-default)",
            }}
          >
            <input
              ref={ref}
              id={id}
              className={`${baseInputClasses} border-0 rounded-none bg-transparent`}
              style={{
                color: "var(--text-primary)",
              }}
              {...rest}
            />
            <div
              className="flex shrink-0 items-stretch border-l"
              style={{ borderColor: error ? "rgba(248,113,113,0.35)" : "var(--border-default)" }}
            >
              {endAdornment}
            </div>
          </div>
        ) : (
          <input
            ref={ref}
            id={id}
            className={`${baseInputClasses} ${error ? "border-red-400 focus:ring-red-400/60 focus:border-red-400" : ""}`}
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: error ? undefined : "var(--border-default)",
              color: "var(--text-primary)",
            }}
            {...rest}
          />
        )}
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
