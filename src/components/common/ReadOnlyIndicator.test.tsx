import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReadOnlyIndicator } from "./ReadOnlyIndicator";

describe("ReadOnlyIndicator", () => {
  it("renders one accessible lock icon without a visible text label", () => {
    const message = "Completed item — read only";
    const { container } = render(<ReadOnlyIndicator message={message} />);

    expect(screen.getByLabelText(message)).toHaveAttribute("title", message);
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(container.textContent).toBe("");
  });
});
