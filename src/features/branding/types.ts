export const WORKNEST_PRIMARY_COLOR = "#9332EA";

export interface BrandingLogo {
  assetId: string;
  url: string;
  variants: Record<string, string>;
  altText: string;
  width?: number | null;
  height?: number | null;
}

export interface TenantBranding {
  tenantId?: number | null;
  tenantKey?: string | null;
  tenantSlug?: string | null;
  companyName: string;
  primaryColor: string;
  brandingVersion: number;
  tokenAlgorithmVersion: number;
  logo?: BrandingLogo | null;
  status?: string | null;
  updatedAt?: string | null;
}

export const WORKNEST_BRANDING: TenantBranding = {
  tenantId: null,
  tenantKey: null,
  tenantSlug: null,
  companyName: "WorkNest",
  primaryColor: WORKNEST_PRIMARY_COLOR,
  brandingVersion: 0,
  tokenAlgorithmVersion: 1,
  logo: null,
  status: "ACTIVE",
};

export interface BrandingUpdateInput {
  companyName?: string;
  primaryColor?: string;
  brandingVersion: number;
}
