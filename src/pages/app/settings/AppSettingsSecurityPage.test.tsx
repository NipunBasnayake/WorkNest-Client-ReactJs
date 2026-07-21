import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppSettingsSecurityPage } from "@/pages/app/settings/AppSettingsSecurityPage";
import { getActiveSessionsApi } from "@/services/api/authApi";

vi.mock("@/services/api/authApi", () => ({
  getActiveSessionsApi: vi.fn(),
  revokeOtherSessionsApi: vi.fn(),
  revokeSessionApi: vi.fn(),
}));

describe("AppSettingsSecurityPage", () => {
  beforeEach(() => {
    vi.mocked(getActiveSessionsApi).mockReset();
    vi.mocked(getActiveSessionsApi).mockResolvedValue([]);
  });

  it("loads active sessions once instead of retriggering after state updates", async () => {
    render(<AppSettingsSecurityPage />);

    await screen.findByText("No active sessions");
    await waitFor(() => expect(getActiveSessionsApi).toHaveBeenCalledTimes(1));
  });
});
