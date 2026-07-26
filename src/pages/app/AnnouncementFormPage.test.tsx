import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnnouncementFormPage } from "@/pages/app/AnnouncementFormPage";
import { useAuthStore } from "@/store/authStore";
import { createAnnouncement, getAnnouncementById } from "@/modules/announcements/services/announcementService";
import { queryKeys } from "@/hooks/queries/queryKeys";
import type { Announcement } from "@/modules/announcements/types";

vi.mock("@/modules/announcements/services/announcementService", () => ({
  createAnnouncement: vi.fn(),
  getAnnouncementById: vi.fn(),
  updateAnnouncement: vi.fn(),
}));

vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: () => undefined,
}));

function renderPage(path = "/demo/announcements/1/edit") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:tenantSlug/announcements/new" element={<AnnouncementFormPage />} />
          <Route path="/:tenantSlug/announcements/:id/edit" element={<AnnouncementFormPage />} />
          <Route path="/app/announcements" element={<div>Announcements Destination</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { ...result, queryClient };
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

    renderPage("/demo/announcements/2/edit");

    await waitFor(() => {
      expect(screen.getByDisplayValue("Editable announcement")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Announcement body that the HR user can manage.")).toBeInTheDocument();
    });
  });

  it("places a newly created announcement in the shared cache before navigating", async () => {
    const created: Announcement = {
      id: "77",
      title: "New policy",
      content: "The new policy is effective immediately.",
      pinned: false,
      authorId: "10",
      authorName: "HR User",
      authorRole: "HR",
      ownedByCurrentUser: true,
      canEdit: true,
      canDelete: true,
      createdAt: "2026-07-25T12:00:00.000Z",
      updatedAt: "2026-07-25T12:00:00.000Z",
    };
    vi.mocked(createAnnouncement).mockResolvedValueOnce(created);

    const { queryClient } = renderPage("/demo/announcements/new");

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: created.title } });
    fireEvent.change(screen.getByLabelText("Content"), { target: { value: created.content } });
    fireEvent.click(screen.getByRole("button", { name: "Publish Announcement" }));

    expect(await screen.findByText("Announcements Destination")).toBeInTheDocument();
    expect(queryClient.getQueryData<Announcement[]>(queryKeys.announcements())).toEqual([created]);
  });
});
