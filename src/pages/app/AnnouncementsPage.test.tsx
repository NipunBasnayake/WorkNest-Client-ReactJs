import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnnouncementsPage } from "@/pages/app/AnnouncementsPage";
import {
  deleteAnnouncement,
  getAnnouncements,
  setAnnouncementPinned,
} from "@/modules/announcements/services/announcementService";
import type { Announcement } from "@/modules/announcements/types";
import { getNotifications } from "@/modules/notifications/services/notificationService";
import { useAuthStore } from "@/store/authStore";

const realtime = vi.hoisted(() => ({
  listener: null as ((payload: unknown) => void) | null,
}));

vi.mock("@/modules/announcements/services/announcementService", () => ({
  getAnnouncements: vi.fn(),
  deleteAnnouncement: vi.fn(),
  setAnnouncementPinned: vi.fn(),
}));

vi.mock("@/modules/notifications/services/notificationService", () => ({
  getNotifications: vi.fn(),
}));

vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: () => undefined,
}));

vi.mock("@/services/realtime/stompService", () => ({
  subscribeRealtime: vi.fn((_destinations: string[], listener: (payload: unknown) => void) => {
    realtime.listener = listener;
    return vi.fn();
  }),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AnnouncementsPage />
      </MemoryRouter>
    </QueryClientProvider>
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
    realtime.listener = null;
    vi.mocked(deleteAnnouncement).mockResolvedValue(undefined);
    vi.mocked(setAnnouncementPinned).mockImplementation(
      async (_id, pinned) => makeAnnouncement({
        pinned,
        ownedByCurrentUser: true,
        canEdit: true,
        canDelete: true,
      }),
    );
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

    expect(await screen.findByText("Workspace Update")).toBeInTheDocument();
    expect(getAnnouncements).toHaveBeenCalledTimes(1);
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

    expect(await screen.findByText("Edit")).toBeInTheDocument();
    expect(getAnnouncements).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("hides HR edit and delete buttons for announcements owned by someone else", async () => {
    vi.mocked(getAnnouncements).mockResolvedValueOnce([
      makeAnnouncement({
        authorName: "Another HR",
        ownedByCurrentUser: false,
        canEdit: false,
        canDelete: false,
      }),
    ]);

    renderPage();

    expect(await screen.findByText("Workspace Update")).toBeInTheDocument();
    expect(getAnnouncements).toHaveBeenCalledTimes(1);
    expect(screen.getByText("New Announcement")).toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
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

    expect(await screen.findByText("Workspace Update")).toBeInTheDocument();
    expect(getAnnouncements).toHaveBeenCalledTimes(1);
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

  it("pins an announcement using the simplified pin endpoint", async () => {
    vi.mocked(getAnnouncements).mockResolvedValueOnce([
      makeAnnouncement({
        ownedByCurrentUser: true,
        canEdit: true,
        canDelete: true,
      }),
    ]);

    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Pin announcement" }),
    );

    await waitFor(() =>
      expect(setAnnouncementPinned).toHaveBeenCalledWith("101", true),
    );
  });

  it("filters announcements with the shared search field and clears the query", async () => {
    vi.mocked(getAnnouncements).mockResolvedValueOnce([
      makeAnnouncement(),
      makeAnnouncement({
        id: "102",
        title: "Policy Update",
        content: "Updated travel policy is now available.",
        authorName: "Operations",
      }),
    ]);

    renderPage();

    await waitFor(() => expect(getAnnouncements).toHaveBeenCalledTimes(1));

    const searchInput = screen.getByRole("searchbox", { name: "Search announcements" });

    fireEvent.change(searchInput, { target: { value: "policy" } });

    expect(screen.getByText("Policy Update")).toBeInTheDocument();
    expect(screen.queryByText("Workspace Update")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear Search announcements" }));

    expect(screen.getByText("Workspace Update")).toBeInTheDocument();
  });

  it("refreshes the React Query list when an announcement realtime event arrives", async () => {
    vi.mocked(getAnnouncements)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([makeAnnouncement({ title: "Realtime Announcement" })]);

    renderPage();

    await waitFor(() => expect(getAnnouncements).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(realtime.listener).not.toBeNull());

    act(() => {
      realtime.listener?.({ id: "101" });
    });

    expect(await screen.findByText("Realtime Announcement")).toBeInTheDocument();
    expect(getAnnouncements).toHaveBeenCalledTimes(2);
  });
});
