import type { CSSProperties } from "react";
import { deriveBrandTokens, normalizeBrandColor } from "@/features/branding/colorTokens";
import type { TenantBranding } from "@/features/branding/types";

const HEX_COLOR = /^#[0-9A-F]{6}$/;

export function BrandColorPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const normalized = normalizeBrandColor(value);
  const invalid = value.length > 0 && !HEX_COLOR.test(value.trim().toUpperCase());

  return (
    <div className="space-y-2">
      <label htmlFor="branding-primary-color" className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        Primary brand color
      </label>
      <div className="flex items-center gap-3">
        <input
          id="branding-primary-color-picker"
          type="color"
          value={normalized}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          disabled={disabled}
          className="h-11 w-14 cursor-pointer rounded-xl border bg-transparent p-1 disabled:cursor-not-allowed"
          style={{ borderColor: "var(--border-default)" }}
          aria-label="Choose primary brand color"
        />
        <input
          id="branding-primary-color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          disabled={disabled}
          maxLength={7}
          placeholder="#2563EB"
          className="h-11 min-w-0 flex-1 rounded-xl border px-3 font-mono text-sm outline-none transition focus:ring-2 focus:ring-primary-500/25 disabled:opacity-60"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: invalid ? "#EF4444" : "var(--border-default)",
            color: "var(--text-primary)",
          }}
          aria-invalid={invalid}
        />
      </div>
      <p className="text-xs" style={{ color: invalid ? "#EF4444" : "var(--text-tertiary)" }}>
        {invalid ? "Enter a color in #RRGGBB format." : "Used for actions, highlights, links, and focus states."}
      </p>
    </div>
  );
}

export function BrandPreview({ branding }: { branding: TenantBranding }) {
  const previewStyle = deriveBrandTokens(branding.primaryColor) as CSSProperties;

  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ ...previewStyle, borderColor: "var(--brand-border)", backgroundColor: "var(--bg-surface)" }}
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--brand-border)", background: "var(--brand-soft)" }}>
        <span className="min-w-0 break-words text-lg font-bold" style={{ color: "var(--color-primary-700)" }}>
          {branding.companyName}
        </span>
        <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--brand-action)", color: "var(--brand-on-primary)" }}>
          Preview
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Your workspace</p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>A live preview of the shared brand tokens.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: "var(--brand-action)", color: "var(--brand-on-primary)" }}>Primary action</span>
          <span className="rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--brand-border)", color: "var(--color-primary-700)" }}>Secondary action</span>
        </div>
      </div>
    </div>
  );
}
