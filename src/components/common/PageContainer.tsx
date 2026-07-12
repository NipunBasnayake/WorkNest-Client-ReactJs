import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
}

const sizeClasses = {
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export function PageContainer({ children, className = "", size = "xl" }: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 py-8 sm:px-6 lg:px-8", sizeClasses[size], className)}>
      {children}
    </div>
  );
}
