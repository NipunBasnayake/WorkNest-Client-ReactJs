import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SearchField } from "@/components/common/SearchField";

function ControlledSearchField() {
  const [value, setValue] = useState("alpha");

  return <SearchField label="Search projects" value={value} onChange={(event) => setValue(event.target.value)} />;
}

describe("SearchField", () => {
  it("renders an accessible controlled search input", () => {
    render(<SearchField label="Search employees" value="" onChange={() => undefined} placeholder="Search by name" />);

    const input = screen.getByRole("searchbox", { name: "Search employees" });

    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Search by name");
  });

  it("shows a clear button when value exists and clears through controlled onChange", () => {
    render(<ControlledSearchField />);

    const input = screen.getByRole("searchbox", { name: "Search projects" });
    const clearButton = screen.getByRole("button", { name: "Clear Search projects" });

    expect(input).toHaveValue("alpha");

    fireEvent.click(clearButton);

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("does not show the clear button when disabled", () => {
    const onClear = vi.fn();

    render(<SearchField label="Search tasks" value="blocked" disabled onChange={() => undefined} onClear={onClear} />);

    expect(screen.queryByRole("button", { name: "Clear Search tasks" })).not.toBeInTheDocument();
  });
});
