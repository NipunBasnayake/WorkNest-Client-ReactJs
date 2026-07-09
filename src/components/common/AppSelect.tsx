import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const AppSelect = forwardRef<HTMLSelectElement, AppSelectProps>(
  ({ className = "", children, error = false, disabled, ...rest }, ref) => {
    const { ["aria-describedby"]: ariaDescribedBy, ...selectProps } = rest;

    return (
      <div className={cn("relative", className)}>
        <select
          ref={ref}
          className={cn(
            "app-select h-10 w-full rounded-xl border px-4 pr-10 text-sm outline-none transition-colors",
            error && "app-select--error",
          )}
          disabled={disabled}
          aria-invalid={error ? true : rest["aria-invalid"]}
          aria-describedby={ariaDescribedBy}
          {...selectProps}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: error ? "#ef4444" : "var(--text-tertiary)" }}
          aria-hidden="true"
        />
      </div>
    );
  }
);

AppSelect.displayName = "AppSelect";
