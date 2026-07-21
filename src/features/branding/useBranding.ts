import { useContext } from "react";
import { BrandingContext } from "@/features/branding/BrandingContext";
import { WORKNEST_BRANDING } from "@/features/branding/types";

export function useBranding() {
  const context = useContext(BrandingContext);
  return context ?? {
    branding: WORKNEST_BRANDING,
    isLoading: false,
    isFallback: true,
    refetch: async () => undefined,
  };
}
