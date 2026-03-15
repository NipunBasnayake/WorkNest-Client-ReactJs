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

export function Logo({ className = "", size = "md" }: LogoProps) {
  const s = sizeMap[size];
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2.5 font-bold tracking-tight no-underline ${className}`}
      style={{ color: "var(--text-primary)" }}
    >
      {/* Icon mark — purple hexagon cluster */}
      <div
        className="flex items-center justify-center rounded-xl shrink-0"
        style={{
          width: s.iconSize + 10,
          height: s.iconSize + 10,
          background: "linear-gradient(135deg, #9332EA 0%, #c084fc 100%)",
          boxShadow: "0 4px 12px rgba(147,50,234,0.4)",
        }}
      >
        <svg
          width={s.iconSize - 4}
          height={s.iconSize - 4}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Stylized W mark */}
          <path
            d="M4 6L7.5 18L12 10L16.5 18L20 6"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <span
        className={`${s.text}`}
        style={{
          background: "linear-gradient(135deg, #9332EA 0%, #a855f7 60%, #c084fc 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        WorkNest
      </span>
    </Link>
  );
}
