import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps, type To } from "react-router-dom";

interface ButtonBaseProps {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
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
    "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-md hover:shadow-lg hover:shadow-primary-500/25",
  secondary:
    "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-md hover:shadow-lg",
  ghost:
    "bg-transparent hover:bg-primary-50 dark:hover:bg-primary-950/30 text-[var(--text-primary)]",
  outline:
    "border-2 border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-md",
};

const sizes = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-6 py-2.5 text-sm gap-2",
  lg: "px-8 py-3 text-base gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();

  if ("to" in rest && rest.to !== undefined) {
    const {
      to,
      disabled = false,
      onClick,
      tabIndex,
      ...linkProps
    } = rest as ButtonAsLink;

    const linkClasses = disabled
      ? `${classes} opacity-50 pointer-events-none cursor-not-allowed`
      : classes;

    return (
      <Link
        {...linkProps}
        to={to}
        className={linkClasses}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : tabIndex}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onClick?.(event);
        }}
      >
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as ButtonAsNative)}>
      {children}
    </button>
  );
}
