import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/components/navigation/AppSidebar";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ tenantKey: "acme" }),
}));

vi.mock("@/hooks/usePermission", () => ({
  usePermission: () => ({ hasPermission: () => true }),
}));

vi.mock("@/features/branding/useBranding", () => ({
  useBranding: () => ({
    branding: {
      companyName: "Acme International Enterprise Holdings and Services",
      primaryColor: "#2563EB",
      brandingVersion: 1,
    },
  }),
}));

describe("AppSidebar", () => {
  it("shows only the wrapping tenant company name and has no desktop collapse control", () => {
    render(
      <MemoryRouter initialEntries={["/acme/dashboard"]}>
        <AppSidebar area="tenant" mobileOpen={false} onMobileClose={vi.fn()} />
      </MemoryRouter>,
    );

    const companyName = screen.getByText("Acme International Enterprise Holdings and Services");
    expect(companyName).toHaveClass("whitespace-normal", "break-words", "text-xl", "font-extrabold");
    expect(screen.queryByText("WorkNest")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /collapse sidebar|expand sidebar/i })).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Sidebar navigation" })).toHaveClass("w-72");
  });
});
