import { useLayoutEffect, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrandingContext } from "@/features/branding/BrandingContext";
import { deriveBrandTokens } from "@/features/branding/colorTokens";
import { getPublicBranding, getTenantBranding } from "@/features/branding/brandingService";
import { WORKNEST_BRANDING } from "@/features/branding/types";

type BrandingMode = "default" | "tenant" | "public";

interface BrandingProviderProps {
  mode: BrandingMode;
  tenantSlug?: string | null;
  children: ReactNode;
}

export function BrandingProvider({ mode, tenantSlug, children }: BrandingProviderProps) {
  const enabled = mode !== "default" && Boolean(tenantSlug);
  const query = useQuery({
    queryKey: ["tenant-branding", mode, tenantSlug ?? "worknest"],
    queryFn: () => mode === "public"
      ? getPublicBranding(tenantSlug!)
      : getTenantBranding(),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const branding = enabled && query.data ? query.data : WORKNEST_BRANDING;
  const tokens = useMemo(() => deriveBrandTokens(branding.primaryColor), [branding.primaryColor]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = new Map<string, string>();
    Object.entries(tokens).forEach(([property, value]) => {
      previous.set(property, root.style.getPropertyValue(property));
      root.style.setProperty(property, value);
    });
    root.dataset.brandingScope = branding.tenantSlug ?? "worknest";

    return () => {
      previous.forEach((value, property) => {
        if (value) root.style.setProperty(property, value);
        else root.style.removeProperty(property);
      });
      delete root.dataset.brandingScope;
    };
  }, [branding.tenantSlug, tokens]);

  const value = useMemo(() => ({
    branding,
    isLoading: enabled && query.isLoading,
    isFallback: !query.data,
    refetch: query.refetch,
  }), [branding, enabled, query.data, query.isLoading, query.refetch]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}
