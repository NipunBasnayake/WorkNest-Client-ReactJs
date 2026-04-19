import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { AnnouncementsPage } from "@/pages/app/AnnouncementsPage";
import { getAnnouncements, deleteAnnouncement } from "@/modules/announcements/services/announcementService";
import type { Announcement } from "@/modules/announcements/types";
import { getNotifications } from "@/modules/notifications/services/notificationService";
import { useAuthStore } from "@/store/authStore";

vi.mock("@/modules/announcements/services/announcementService", () => ({
  getAnnouncements: vi.fn(),
  deleteAnnouncement: vi.fn(),
}));

vi.mock("@/modules/notifications/services/notificationService", () => ({
  getNotifications: vi.fn(),
}));

vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: () => undefined,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AnnouncementsPage />
    </MemoryRouter>
  );
}

function makeAnnouncement(overrides: Partial<Announcement> = {}): Announcement {
  return {
    id: "101",
    title: "Workspace Update",
    content: "Office will open at 9 AM next Monday.",
    pinned: false,
    authorId: "5",
    authorName: "HR Manager",
    authorRole: "HR",
    teamId: undefined,
    teamName: undefined,
    ownedByCurrentUser: false,
    canEdit: false,
    canDelete: false,
    createdAt: "2026-04-18T08:00:00.000Z",
    updatedAt: "2026-04-18T08:00:00.000Z",
    ...overrides,
  };
}

describe("AnnouncementsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deleteAnnouncement).mockResolvedValue(undefined);
    useAuthStore.setState({
      isAuthenticated: true,
      sessionType: "tenant",
      tenantKey: "acme",
      user: { id: "20", name: "HR User", email: "hr@worknest.test", role: "HR", tenantKey: "acme" },
      isBootstrapping: false,
      isLoading: false,
      error: null,
    });
  });

  it("shows a sender's created announcement in the list with HR management actions", async () => {
    vi.mocked(getAnnouncements).mockResolvedValueOnce([
      makeAnnouncement({
        ownedByCurrentUser: true,
        canEdit: true,
        canDelete: true,
      }),
    ]);

    renderPage();

    await waitFor(() => expect(getAnnouncements).toHaveBeenCalledTimes(1));

    expect(screen.getByText("Workspace Update")).toBeInTheDocument();
    expect(screen.getByText("Office will open at 9 AM next Monday.")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("New Announcement")).toBeInTheDocument();
  });

  it("shows tenant admin CRUD buttons for visible announcements they did not create", async () => {
    useAuthStore.setState({
      user: { id: "99", name: "Tenant Admin", email: "admin@worknest.test", role: "TENANT_ADMIN", tenantKey: "acme" },
    });
    vi.mocked(getAnnouncements).mockResolvedValueOnce([
      makeAnnouncement({
        authorName: "Another Author",
        ownedByCurrentUser: false,
        canEdit: true,
        canDelete: true,
      }),
    ]);

    renderPage();

    await waitFor(() => expect(getAnnouncements).toHaveBeenCalledTimes(1));

    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("shows announcements to employees in read-only mode", async () => {
    useAuthStore.setState({
      user: { id: "30", name: "Employee User", email: "employee@worknest.test", role: "EMPLOYEE", tenantKey: "acme" },
    });
    vi.mocked(getAnnouncements).mockResolvedValueOnce([
      makeAnnouncement({
        canEdit: false,
        canDelete: false,
        ownedByCurrentUser: false,
      }),
    ]);

    renderPage();

    await waitFor(() => expect(getAnnouncements).toHaveBeenCalledTimes(1));

    expect(screen.getByText("Workspace Update")).toBeInTheDocument();
    expect(screen.queryByText("New Announcement")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("does not depend on the notifications list to render announcements", async () => {
    vi.mocked(getAnnouncements).mockResolvedValueOnce([makeAnnouncement()]);

    renderPage();

    await waitFor(() => expect(getAnnouncements).toHaveBeenCalledTimes(1));
    expect(getNotifications).not.toHaveBeenCalled();
  });
});
