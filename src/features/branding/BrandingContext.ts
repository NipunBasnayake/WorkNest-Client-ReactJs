import { createContext } from "react";
import type { TenantBranding } from "@/features/branding/types";

export interface BrandingContextValue {
  branding: TenantBranding;
  isLoading: boolean;
  isFallback: boolean;
  refetch: () => Promise<unknown>;
}

export const BrandingContext = createContext<BrandingContextValue | null>(null);
