import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextareaField } from "@/components/common/TextareaField";

describe("TextareaField", () => {
  it("renders an accessible textarea with label and hint", () => {
    render(<TextareaField label="Notes" hint="Add useful context." value="" onChange={() => undefined} />);

    const textarea = screen.getByRole("textbox", { name: "Notes" });

    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAccessibleDescription("Add useful context.");
  });

  it("marks errors accessibly", () => {
    render(<TextareaField label="Reason" error="Reason is required." value="" onChange={() => undefined} />);

    const textarea = screen.getByRole("textbox", { name: "Reason" });

    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAccessibleDescription("Reason is required.");
  });

  it("supports required, disabled, rows, and className props", () => {
    render(
      <TextareaField
        label="Summary"
        required
        disabled
        rows={6}
        className="min-h-40"
        value=""
        onChange={() => undefined}
      />,
    );

    const textarea = screen.getByRole("textbox", { name: "Summary" });

    expect(textarea).toBeDisabled();
    expect(textarea).toBeRequired();
    expect(textarea).toHaveAttribute("rows", "6");
    expect(textarea).toHaveClass("min-h-40");
  });
});
