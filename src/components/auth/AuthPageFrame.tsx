import type { ReactNode } from "react";

interface AuthPageFrameProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthPageFrame({ title, description, children }: AuthPageFrameProps) {
  return (
    <section className="w-full max-w-md animate-fade-up sm:max-w-lg">
      <div
        className="max-h-[calc(100vh-6.5rem)] overflow-y-auto rounded-2xl border p-6 shadow-sm backdrop-blur-md sm:max-h-[calc(100vh-7.5rem)] sm:p-7"
        style={{
          backgroundColor: "color-mix(in srgb, var(--bg-surface) 96%, var(--bg-muted))",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="mb-6 flex flex-col items-center gap-4 text-center sm:mb-7">

          <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: "var(--color-primary-500)" }} />

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]" style={{ color: "var(--text-primary)" }}>
              {title}
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {description}
            </p>
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}
