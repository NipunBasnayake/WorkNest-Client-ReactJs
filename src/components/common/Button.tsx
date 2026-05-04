import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps, type To } from "react-router-dom";

interface ButtonBaseProps {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  children: ReactNode;
  className?: string;
  loading?: boolean;
  loadingLabel?: string;
}

type ButtonAsNative = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<LinkProps, "to" | "className" | "children"> & {
    to: To;
    disabled?: boolean;
  };

type ButtonProps = ButtonAsNative | ButtonAsLink;

const base =
  "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:pointer-events-none select-none";

const variants = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm hover:shadow-md hover:shadow-primary-500/15",
  secondary:
    "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] active:bg-[var(--bg-muted)] shadow-sm",
  ghost:
    "bg-transparent hover:bg-[var(--bg-surface-hover)] dark:hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)]",
  outline:
    "border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] dark:hover:bg-[var(--bg-surface-hover)]",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md",
};

const sizes = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-6 py-2.5 text-sm gap-2",
  lg: "px-8 py-3 text-base gap-2.5",
  icon: "h-10 w-10 p-0 text-sm gap-0",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  loading = false,
  loadingLabel = "Loading",
  ...rest
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
  const content = (
    <>
      {loading && <ButtonSpinner />}
      {children}
      {loading && <span className="sr-only">{loadingLabel}</span>}
    </>
  );

  if ("to" in rest && rest.to !== undefined) {
    const {
      to,
      disabled = false,
      onClick,
      tabIndex,
      ...linkProps
    } = rest as ButtonAsLink;

    const isDisabled = disabled || loading;
    const linkClasses = isDisabled
      ? `${classes} opacity-50 pointer-events-none cursor-not-allowed`
      : classes;

    return (
      <Link
        {...linkProps}
        to={to}
        className={linkClasses}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : tabIndex}
        onClick={(event) => {
          if (isDisabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onClick?.(event);
        }}
      >
        {content}
      </Link>
    );
  }

  const { disabled = false, ...buttonProps } = rest as ButtonAsNative;

  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...buttonProps}>
      {content}
    </button>
  );
}

function ButtonSpinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
