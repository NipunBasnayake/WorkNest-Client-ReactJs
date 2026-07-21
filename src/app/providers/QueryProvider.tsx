import { useEffect, useMemo, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";

interface QueryProviderProps {
  children: ReactNode;
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  const typedError = error as { status?: number; response?: { status?: number } } | null;
  const status = typedError?.status ?? typedError?.response?.status;
  if (status === 401 || status === 403) return false;
  return failureCount < 2;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const sessionIdentity = useAuthStore((state) => [
    state.sessionType ?? "anonymous",
    state.tenantKey ?? "none",
    state.user?.id ?? "none",
  ].join(":"));
  const queryClient = useMemo(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          gcTime: 5 * 60_000,
          retry: shouldRetry,
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
          meta: { sessionIdentity },
        },
        mutations: {
          retry: 0,
        },
      },
    }),
    [sessionIdentity],
  );

  useEffect(() => () => queryClient.clear(), [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
