import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { AnnouncementFormPage } from "@/pages/app/AnnouncementFormPage";
import { useAuthStore } from "@/store/authStore";
import { getAnnouncementById } from "@/modules/announcements/services/announcementService";

vi.mock("@/modules/announcements/services/announcementService", () => ({
  createAnnouncement: vi.fn(),
  getAnnouncementById: vi.fn(),
  updateAnnouncement: vi.fn(),
}));

vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: () => undefined,
}));

function renderPage(path = "/app/announcements/1/edit") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/announcements/new" element={<AnnouncementFormPage />} />
        <Route path="/app/announcements/:id/edit" element={<AnnouncementFormPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AnnouncementFormPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: true,
      sessionType: "tenant",
      tenantKey: "acme",
      user: { id: "10", name: "HR User", email: "hr@worknest.test", role: "HR", tenantKey: "acme" },
      isBootstrapping: false,
      isLoading: false,
      error: null,
    });
  });

  it("blocks editing announcements the current user is not allowed to manage", async () => {
    vi.mocked(getAnnouncementById).mockResolvedValueOnce({
      id: "1",
      title: "Other announcement",
      content: "Announcement body for another HR user.",
      pinned: false,
      authorId: "99",
      authorName: "Another HR",
      authorRole: "HR",
      ownedByCurrentUser: false,
      canEdit: false,
      canDelete: false,
      createdAt: "2026-04-18T08:00:00.000Z",
      updatedAt: "2026-04-18T08:00:00.000Z",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("You can edit only announcements you are allowed to manage.")).toBeInTheDocument();
    });
  });

  it("loads editable announcement data for an allowed creator", async () => {
    vi.mocked(getAnnouncementById).mockResolvedValueOnce({
      id: "2",
      title: "Editable announcement",
      content: "Announcement body that the HR user can manage.",
      pinned: false,
      authorId: "10",
      authorName: "HR User",
      authorRole: "HR",
      ownedByCurrentUser: true,
      canEdit: true,
      canDelete: true,
      createdAt: "2026-04-18T08:00:00.000Z",
      updatedAt: "2026-04-18T08:00:00.000Z",
    });

    renderPage("/app/announcements/2/edit");

    await waitFor(() => {
      expect(screen.getByDisplayValue("Editable announcement")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Announcement body that the HR user can manage.")).toBeInTheDocument();
    });
  });
});
