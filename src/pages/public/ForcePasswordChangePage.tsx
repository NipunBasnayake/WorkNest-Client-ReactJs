import { usePageMeta } from "@/hooks/usePageMeta";

export function ForcePasswordChangePage() {
  usePageMeta({ title: "Password Update Required - WorkNest" });

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-sky-50 to-cyan-100 px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl backdrop-blur-sm sm:p-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Password Update Required</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your account requires a password update before continuing. Please proceed with the password reset flow from your administrator or authentication provider.
        </p>
      </div>
    </section>
  );
}
