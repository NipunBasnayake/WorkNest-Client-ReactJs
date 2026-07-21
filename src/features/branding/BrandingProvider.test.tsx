import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrandingProvider } from "@/features/branding/BrandingProvider";
import { useBranding } from "@/features/branding/useBranding";

vi.mock("@/features/branding/brandingService", () => ({
  getPublicBranding: vi.fn(async (slug: string) => ({
    tenantSlug: slug,
    companyName: slug === "blue" ? "Blue Company" : "Green Company",
    primaryColor: slug === "blue" ? "#2563EB" : "#059669",
    brandingVersion: 1,
  })),
  getTenantBranding: vi.fn(),
}));

function BrandName() {
  const { branding } = useBranding();
  return <span>{branding.companyName}</span>;
}

function renderBrand(slug: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrandingProvider mode="public" tenantSlug={slug}><BrandName /></BrandingProvider>
    </QueryClientProvider>
  );
}

describe("BrandingProvider scope", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("style");
    delete document.documentElement.dataset.brandingScope;
  });

  it("applies tenant tokens and restores the root after unmount", async () => {
    const view = renderBrand("blue");
    await screen.findByText("Blue Company");
    expect(document.documentElement.style.getPropertyValue("--tenant-primary")).toBe("#2563EB");
    expect(document.documentElement.dataset.brandingScope).toBe("blue");

    view.unmount();
    expect(document.documentElement.style.getPropertyValue("--tenant-primary")).toBe("");
    expect(document.documentElement.dataset.brandingScope).toBeUndefined();
  });

  it("does not leak the previous tenant when scopes are opened sequentially", async () => {
    const first = renderBrand("blue");
    await screen.findByText("Blue Company");
    first.unmount();

    renderBrand("green");
    await screen.findByText("Green Company");
    await waitFor(() => expect(document.documentElement.style.getPropertyValue("--tenant-primary")).toBe("#059669"));
  });
});
