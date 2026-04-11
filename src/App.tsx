import { ThemeProvider }  from "@/app/providers/ThemeProvider";
import { AuthProvider }   from "@/app/providers/AuthProvider";
import { NetworkProvider } from "@/app/providers/NetworkProvider";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { AppRouter }      from "@/app/router";
import { GlobalErrorBoundary } from "@/components/common/GlobalErrorBoundary";
import { ToastViewport } from "@/components/common/ToastViewport";

export default function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <NetworkProvider>
          <AuthProvider>
            <GlobalErrorBoundary>
              <AppRouter />
              <ToastViewport />
            </GlobalErrorBoundary>
          </AuthProvider>
        </NetworkProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
