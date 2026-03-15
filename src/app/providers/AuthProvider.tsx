import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider bootstraps the session on app mount.
 * It sits inside ThemeProvider but wraps the router.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return <>{children}</>;
}
