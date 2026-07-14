import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "@/components/common/Pagination";

describe("Pagination", () => {
  it("shows the current record range and navigates pages", () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={2} totalItems={186} pageSize={20} onPageChange={onPageChange} onPageSizeChange={vi.fn()} />);

    expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 21–40 of 186 records");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("changes page size and disables unavailable navigation", () => {
    const onPageSizeChange = vi.fn();
    render(<Pagination currentPage={1} totalItems={8} pageSize={10} onPageChange={vi.fn()} onPageSizeChange={onPageSizeChange} />);

    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Rows per page"), { target: { value: "25" } });
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });
});
