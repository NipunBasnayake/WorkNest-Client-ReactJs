import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className = "", label, ...rest },
  ref,
) {
  const control = (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded-[0.375rem] border border-[var(--border-default)] bg-[var(--bg-surface)] text-primary-500 accent-primary-500 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  );

  if (!label) return control;

  return (
    <label className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
      {control}
      <span>{label}</span>
    </label>
  );
});

Checkbox.displayName = "Checkbox";