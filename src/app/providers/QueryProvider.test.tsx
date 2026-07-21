import { act, render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { useAuthStore } from "@/store/authStore";

function ClientProbe({ onClient }: { onClient: (client: QueryClient) => void }) {
  const client = useQueryClient();

  useEffect(() => {
    onClient(client);
  }, [client, onClient]);
  return null;
}

describe("QueryProvider", () => {
  it("replaces and clears the query cache when the workspace identity changes", async () => {
    const original = useAuthStore.getState();
    const clients: QueryClient[] = [];
    const capture = (client: QueryClient) => clients.push(client);

    const view = render(
      <QueryProvider>
        <ClientProbe onClient={capture} />
      </QueryProvider>,
    );

    await waitFor(() => expect(clients).toHaveLength(1));
    const anonymousClient = clients[0];
    anonymousClient.setQueryData(["workspace-private"], { tenant: "anonymous" });

    act(() => {
      useAuthStore.setState({ sessionType: "tenant", tenantKey: "tenant-a" });
    });

    await waitFor(() => expect(clients).toHaveLength(2));
    expect(clients[1]).not.toBe(anonymousClient);
    await waitFor(() => expect(anonymousClient.getQueryData(["workspace-private"])).toBeUndefined());

    view.unmount();
    act(() => {
      useAuthStore.setState({
        user: original.user,
        isAuthenticated: original.isAuthenticated,
        sessionType: original.sessionType,
        tenantKey: original.tenantKey,
        isLoading: original.isLoading,
        isBootstrapping: original.isBootstrapping,
        authReady: original.authReady,
        error: original.error,
        passwordChangeRequired: original.passwordChangeRequired,
        passwordChangeChallenge: original.passwordChangeChallenge,
      });
    });
  });
});
