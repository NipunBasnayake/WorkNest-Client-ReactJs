import { render, waitFor } from "@testing-library/react";
import { MessageThread } from "@/app/chat/MessageThread";
import type { ChatConversation, ChatMessage } from "@/modules/chat/types";

const conversation = (id: string): ChatConversation => ({
  id,
  type: "TEAM",
  title: `Team ${id}`,
  subtitle: "Project chat",
  participants: [],
  lastMessage: "Latest",
  lastMessageAt: "2026-07-21T12:00:00Z",
  unreadCount: 0,
  name: `Team ${id}`,
});

const message = (id: string, conversationId: string): ChatMessage => ({
  id,
  chatType: "TEAM",
  conversationId,
  senderEmployeeId: "employee-2",
  senderId: "employee-2",
  senderName: "Nimal",
  message: `Message ${id}`,
  content: `Message ${id}`,
  createdAt: `2026-07-21T12:0${id}:00Z`,
  attachments: [],
});

describe("MessageThread", () => {
  it("scrolls to the latest message when switching conversations with the same message count", async () => {
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: scrollTo });
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => 720 });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get: () => 240 });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });

    const first = conversation("1");
    const second = conversation("2");
    const { rerender } = render(
      <MessageThread
        conversation={first}
        messages={[message("1", "1")]}
        currentUserId="employee-1"
        isLoading={false}
        showMobileBackButton={false}
        onMobileBack={() => undefined}
      />,
    );

    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 720, behavior: "auto" }));
    scrollTo.mockClear();

    rerender(
      <MessageThread
        conversation={second}
        messages={[message("1", "1")]}
        currentUserId="employee-1"
        isLoading={true}
        showMobileBackButton={false}
        onMobileBack={() => undefined}
      />,
    );
    rerender(
      <MessageThread
        conversation={second}
        messages={[message("2", "2")]}
        currentUserId="employee-1"
        isLoading={false}
        showMobileBackButton={false}
        onMobileBack={() => undefined}
      />,
    );

    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 720, behavior: "auto" }));
  });
});
