import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("keeps custom className overrides and existing button behavior", () => {
    const onClick = vi.fn();

    render(
      <Button type="button" className="w-full" onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toHaveClass("w-full");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disables native buttons while loading", () => {
    const onClick = vi.fn();

    render(
      <Button type="button" loading onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: /Save/ });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("prevents link navigation callbacks while loading", () => {
    const onClick = vi.fn();

    render(
      <MemoryRouter>
        <Button to="/next" loading onClick={onClick}>
          Continue
        </Button>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: /Continue/ });

    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("aria-busy", "true");
    fireEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("supports icon-only sizing", () => {
    render(
      <Button type="button" size="icon" aria-label="Refresh">
        R
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Refresh" })).toHaveClass("h-10", "w-10", "p-0");
  });
});
