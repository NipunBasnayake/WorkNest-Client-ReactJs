import type { InputHTMLAttributes, ReactNode } from "react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightAdornment?: ReactNode;
}

export function AuthField({
  label,
  id,
  error,
  rightAdornment,
  className,
  ...inputProps
}: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={[
            "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 transition-all duration-200",
            "placeholder:text-slate-400",
            "focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100",
            error ? "border-rose-400" : "border-slate-200 hover:border-slate-300",
            rightAdornment ? "pr-12" : "",
            className ?? "",
          ].join(" ")}
          aria-invalid={Boolean(error)}
          {...inputProps}
        />
        {rightAdornment ? (
          <div className="absolute inset-y-0 right-3 flex items-center">{rightAdornment}</div>
        ) : null}
      </div>
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
