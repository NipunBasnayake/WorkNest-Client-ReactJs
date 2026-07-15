import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownContent } from "@/modules/recruitment/components/MarkdownContent";

describe("MarkdownContent", () => {
  it("renders the job-authoring Markdown features used by public previews", () => {
    render(<MarkdownContent>{`# Frontend Developer

**Build useful products** with our team.

- [x] React
- [ ] TypeScript

| Skill | Level |
| --- | --- |
| React | Strong |

> Thoughtful engineering matters.

\`\`\`ts
const role = "frontend";
\`\`\`
`}</MarkdownContent>);

    expect(screen.getByRole("heading", { level: 1, name: "Frontend Developer" })).toBeInTheDocument();
    expect(screen.getByText("Build useful products").tagName).toBe("STRONG");
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(within(screen.getByRole("table")).getByText("Strong")).toBeInTheDocument();
    expect(screen.getByText("Thoughtful engineering matters.")).toBeInTheDocument();
    expect(screen.getByText('const role = "frontend";')).toBeInTheDocument();
  });
});
