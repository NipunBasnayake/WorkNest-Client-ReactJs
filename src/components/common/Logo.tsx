import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { iconSize: 18, text: "text-lg" },
  md: { iconSize: 22, text: "text-xl" },
  lg: { iconSize: 28, text: "text-2xl" },
};

interface WorkNestBrandProps {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

export function WorkNestBrand({ size = "md", showName = true, className = "" }: WorkNestBrandProps) {
  const sizing = sizeMap[size];
  return (
    <span className={`inline-flex items-center gap-2.5 font-bold tracking-tight ${className}`}>
      <span
        className="flex shrink-0 items-center justify-center rounded-xl"
        style={{
          width: sizing.iconSize + 10,
          height: sizing.iconSize + 10,
          background: "linear-gradient(135deg, var(--worknest-primary) 0%, var(--worknest-highlight) 100%)",
          boxShadow: "0 4px 12px color-mix(in srgb, var(--worknest-primary) 40%, transparent)",
        }}
      >
        <svg
          width={sizing.iconSize - 4}
          height={sizing.iconSize - 4}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4 6L7.5 18L12 10L16.5 18L20 6"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {showName && (
        <span
          className={sizing.text}
          style={{
            background: "linear-gradient(135deg, var(--worknest-primary) 0%, var(--worknest-highlight) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          WorkNest
        </span>
      )}
    </span>
  );
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center font-bold tracking-tight no-underline ${className}`}
      style={{ color: "var(--text-primary)" }}
    >
      <WorkNestBrand size={size} />
    </Link>
  );
}
