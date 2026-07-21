export const WORKNEST_PRIMARY_COLOR = "#9332EA";

export interface TenantBranding {
  tenantId?: number | null;
  tenantKey?: string | null;
  tenantSlug?: string | null;
  companyName: string;
  primaryColor: string;
  brandingVersion: number;
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
  status: "ACTIVE",
};

export interface BrandingUpdateInput {
  companyName?: string;
  primaryColor?: string;
  brandingVersion: number;
}
