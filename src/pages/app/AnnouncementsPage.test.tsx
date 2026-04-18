import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { AnnouncementsPage } from "@/pages/app/AnnouncementsPage";
import { getAnnouncements, deleteAnnouncement } from "@/modules/announcements/services/announcementService";

vi.mock("@/modules/announcements/services/announcementService", () => ({
  getAnnouncements: vi.fn(),
  deleteAnnouncement: vi.fn(),
}));

vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: () => undefined,
}));

vi.mock("@/hooks/usePermission", () => ({
  usePermission: () => ({
    hasPermission: () => true,
  }),
}));

describe("AnnouncementsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deleteAnnouncement).mockResolvedValue(undefined);
  });

  it("loads announcements from announcement API and renders cards", async () => {
    vi.mocked(getAnnouncements).mockResolvedValueOnce([
      {
        id: "101",
        title: "Workspace Update",
        content: "Office will open at 9 AM next Monday.",
        pinned: false,
        authorId: "5",
        authorName: "HR Manager",
        authorRole: "HR",
        createdAt: "2026-04-18T08:00:00.000Z",
        updatedAt: "2026-04-18T08:00:00.000Z",
      },
    ]);

    render(
      <MemoryRouter>
        <AnnouncementsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(getAnnouncements).toHaveBeenCalledTimes(1));

    expect(screen.getByText("Workspace Update")).toBeInTheDocument();
    expect(screen.getByText("Office will open at 9 AM next Monday.")).toBeInTheDocument();
    expect(screen.getByText("Hr")).toBeInTheDocument();
  });
});
