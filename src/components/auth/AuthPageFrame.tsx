import type { ReactNode } from "react";

interface AuthPageFrameProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthPageFrame({ title, description, children }: AuthPageFrameProps) {
  return (
    <section className="w-full max-w-md animate-fade-up">
      <div
        className="max-h-[calc(100vh-6.5rem)] overflow-y-auto rounded-3xl border p-6 shadow-xl backdrop-blur-xl sm:max-h-[calc(100vh-7.5rem)] sm:p-7"
        style={{
          backgroundColor: "color-mix(in srgb, var(--bg-surface) 90%, transparent)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        <div className="mb-6 flex flex-col items-center gap-4 text-center sm:mb-7">
          {/* <Logo size="md" /> */}

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
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