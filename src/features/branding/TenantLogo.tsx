import { useMemo, useState } from "react";
import { WorkNestBrand } from "@/components/common/Logo";
import { useBranding } from "@/features/branding/useBranding";
import type { TenantBranding } from "@/features/branding/types";

type TenantLogoSize = "compact" | "sidebar" | "header" | "settings" | "hero" | "report";

interface TenantLogoProps {
  size?: TenantLogoSize;
  showName?: boolean;
  eager?: boolean;
  className?: string;
  brandingOverride?: TenantBranding;
}

const SIZE_CLASS: Record<TenantLogoSize, string> = {
  compact: "h-6 max-w-24",
  sidebar: "h-8 max-w-32",
  header: "h-8 max-w-36",
  settings: "h-16 max-w-52",
  hero: "h-20 max-w-64",
  report: "h-12 max-w-40",
};

const FALLBACK_SIZE: Record<TenantLogoSize, "sm" | "md" | "lg"> = {
  compact: "sm",
  sidebar: "sm",
  header: "md",
  settings: "lg",
  hero: "lg",
  report: "md",
};

const IMAGE_SIZES: Record<TenantLogoSize, string> = {
  compact: "96px",
  sidebar: "128px",
  header: "144px",
  settings: "208px",
  hero: "256px",
  report: "160px",
};

export function TenantLogo({
  size = "header",
  showName = true,
  eager = false,
  className = "",
  brandingOverride,
}: TenantLogoProps) {
  const { branding: contextBranding } = useBranding();
  const branding = brandingOverride ?? contextBranding;
  const [brokenSource, setBrokenSource] = useState<string | null>(null);
  const logoSource = useMemo(() => {
    const variants = branding.logo?.variants ?? {};
    const preferred = size === "compact" || size === "sidebar"
      ? variants["128"] ?? variants["64"]
      : size === "hero"
        ? variants["512"] ?? variants["256"]
        : variants["256"] ?? variants["128"];
    return preferred ?? branding.logo?.url ?? null;
  }, [branding.logo, size]);
  const logoSrcSet = useMemo(() => Object.entries(branding.logo?.variants ?? {})
    .map(([width, url]) => ({ width: Number.parseInt(width, 10), url }))
    .filter(({ width, url }) => Number.isFinite(width) && width > 0 && Boolean(url))
    .sort((left, right) => left.width - right.width)
    .map(({ width, url }) => `${url} ${width}w`)
    .join(", ") || undefined, [branding.logo?.variants]);

  const broken = Boolean(logoSource && brokenSource === logoSource);

  if (!logoSource || broken) {
    return (
      <WorkNestBrand
        size={FALLBACK_SIZE[size]}
        showName={showName}
        className={className}
      />
    );
  }

  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <span className="flex shrink-0 items-center justify-center rounded-lg bg-white/95 p-1 shadow-sm ring-1 ring-black/5 dark:bg-white/90">
        <img
          src={logoSource}
          srcSet={logoSrcSet}
          sizes={logoSrcSet ? IMAGE_SIZES[size] : undefined}
          alt={branding.logo?.altText ?? `${branding.companyName} logo`}
          className={`${SIZE_CLASS[size]} w-auto object-contain`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setBrokenSource(logoSource)}
        />
      </span>
      {showName && (
        <span className="min-w-0 truncate text-base font-bold text-inherit">
          {branding.companyName}
        </span>
      )}
    </span>
  );
}
