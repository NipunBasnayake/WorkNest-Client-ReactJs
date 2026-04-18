import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { NotificationsPage } from "@/pages/app/NotificationsPage";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeNotifications,
} from "@/modules/notifications/services/notificationService";

vi.mock("@/modules/notifications/services/notificationService", () => ({
  getNotifications: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  markNotificationAsRead: vi.fn(),
  subscribeNotifications: vi.fn(),
}));

vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: () => undefined,
}));

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(markAllNotificationsAsRead).mockResolvedValue(undefined);
    vi.mocked(markNotificationAsRead).mockResolvedValue(undefined);
    vi.mocked(subscribeNotifications).mockReturnValue(() => undefined);
  });

  it("shows announcement-linked notification and navigates to announcement detail on click", async () => {
    vi.mocked(getNotifications).mockResolvedValueOnce([
      {
        id: "n-1",
        type: "ANNOUNCEMENT",
        title: "Announcement",
        message: "New policy published",
        link: "/app/announcements/55",
        relatedEntityType: "ANNOUNCEMENT",
        relatedEntityId: "55",
        announcementId: "55",
        read: false,
        createdAt: "2026-04-18T08:00:00.000Z",
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<NotificationsPage />} />
          <Route path="/app/announcements/:id" element={<div>Announcement Detail Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(getNotifications).toHaveBeenCalled());
    fireEvent.click(screen.getByText("Announcement"));

    await waitFor(() => {
      expect(markNotificationAsRead).toHaveBeenCalledWith("n-1");
    });
    await waitFor(() => {
      expect(screen.getByText("Announcement Detail Page")).toBeInTheDocument();
    });
  });

  it("keeps fallback behavior for non-linked notifications", async () => {
    vi.mocked(getNotifications).mockResolvedValueOnce([
      {
        id: "n-2",
        type: "SYSTEM",
        title: "System Notification",
        message: "Background sync completed",
        read: false,
        createdAt: "2026-04-18T08:05:00.000Z",
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<NotificationsPage />} />
          <Route path="/app/announcements/:id" element={<div>Announcement Detail Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(getNotifications).toHaveBeenCalled());
    fireEvent.click(screen.getByText("System Notification"));

    expect(markNotificationAsRead).not.toHaveBeenCalled();
    expect(screen.queryByText("Announcement Detail Page")).not.toBeInTheDocument();
  });
});
