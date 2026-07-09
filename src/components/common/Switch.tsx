import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { className = "", label, ...rest },
  ref,
) {
  const control = (
    <input
      ref={ref}
      type="checkbox"
      role="switch"
      className={cn(
        "relative h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full border border-[var(--border-default)] bg-[var(--bg-muted)] transition-colors before:absolute before:left-0.5 before:top-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow-sm before:transition-transform before:content-[''] checked:border-primary-500 checked:bg-primary-500 checked:before:translate-x-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  );

  if (!label) return control;

  return (
    <label className="inline-flex items-center justify-between gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
      <span>{label}</span>
      {control}
    </label>
  );
});

Switch.displayName = "Switch";