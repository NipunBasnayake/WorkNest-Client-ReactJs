import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UserAvatar } from "@/components/common/UserAvatar";

vi.mock("@/services/uploads/protectedImageCache", () => ({
  acquireProtectedImage: vi.fn(async (source: string) => source),
  releaseProtectedImage: vi.fn(),
}));

describe("UserAvatar", () => {
  it("uses stable initials when no image is available", () => {
    render(<UserAvatar name="Jane Doe" email="jane@example.com" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByLabelText("Jane Doe")).toBeInTheDocument();
  });

  it("falls back to initials when a resolved image is broken", async () => {
    render(<UserAvatar name="Alex Morgan" src="/api/acme/files/avatar/128" />);
    const image = await screen.findByRole("img", { name: "Alex Morgan" });
    fireEvent.error(image);
    await waitFor(() => expect(screen.getByText("AM")).toBeInTheDocument());
  });

  it("exposes optional presence state without changing the accessible name", () => {
    render(<UserAvatar email="person@example.com" status="online" size="sm" />);
    expect(screen.getByLabelText("person@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText("online")).toBeInTheDocument();
  });
});
