import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { EmployeeSkillsField } from "@/modules/employees/components/EmployeeSkillsField";
import type { EmployeeSkillPayload } from "@/modules/employees/types";

function SkillsHarness() {
  const [skills, setSkills] = useState<EmployeeSkillPayload[]>([]);
  return (
    <EmployeeSkillsField
      skills={skills}
      suggestions={[{ name: "React" }, { name: "Spring Boot" }]}
      onChange={setSkills}
    />
  );
}

describe("EmployeeSkillsField", () => {
  it("normalizes typed skills and rejects case-insensitive duplicates", () => {
    render(<SkillsHarness />);

    const input = screen.getByLabelText("Skills");
    fireEvent.change(input, { target: { value: "  REACT   native " } });
    fireEvent.click(screen.getByRole("button", { name: "Add skill" }));

    expect(screen.getByText("React Native")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "react native" } });
    fireEvent.click(screen.getByRole("button", { name: "Add skill" }));

    expect(screen.getByRole("alert")).toHaveTextContent("React Native is already selected.");
    expect(screen.getAllByText("React Native")).toHaveLength(1);
  });

  it("removes a selected skill from the employee form", () => {
    render(<SkillsHarness />);

    fireEvent.change(screen.getByLabelText("Skills"), { target: { value: "Spring Boot" } });
    fireEvent.click(screen.getByRole("button", { name: "Add skill" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Spring Boot" }));

    expect(screen.queryByText("Spring Boot")).not.toBeInTheDocument();
    expect(screen.getByText("No skills selected.")).toBeInTheDocument();
  });
});
