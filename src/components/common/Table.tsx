import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-[var(--bg-surface)]",
        className
      )}
      style={{ borderColor: "var(--border-default)" }}
    >
      {children}
    </div>
  );
}