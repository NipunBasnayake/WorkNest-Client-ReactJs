import { render, screen } from "@testing-library/react";
import { AttendanceStatusBadge } from "@/modules/attendance/components/AttendanceStatusBadge";

describe("AttendanceStatusBadge", () => {
  it("renders incomplete attendance clearly", () => {
    render(<AttendanceStatusBadge status="INCOMPLETE" />);

    expect(screen.getByText("Incomplete")).toBeInTheDocument();
  });
});