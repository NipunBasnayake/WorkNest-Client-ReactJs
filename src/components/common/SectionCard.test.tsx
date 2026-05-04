import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionCard } from "@/components/common/SectionCard";

describe("SectionCard", () => {
  it("keeps the default card classes compatible", () => {
    render(
      <SectionCard title="Overview" subtitle="Current status">
        Content
      </SectionCard>,
    );

    const section = screen.getByText("Overview").closest("section");

    expect(section).toHaveClass("rounded-2xl", "border");
    expect(screen.getByText("Current status")).toBeInTheDocument();
  });

  it("supports dense, table, and plain variants without changing the default API", () => {
    const { rerender } = render(<SectionCard variant="dense">Dense content</SectionCard>);

    expect(screen.getByText("Dense content").closest("section")).toHaveClass("rounded-2xl", "border");

    rerender(<SectionCard variant="table">Table content</SectionCard>);
    expect(screen.getByText("Table content").closest("section")).toHaveClass("overflow-hidden", "rounded-2xl");

    rerender(<SectionCard variant="plain">Plain content</SectionCard>);
    expect(screen.getByText("Plain content").closest("section")).toHaveStyle({ boxShadow: "none" });
  });
});
