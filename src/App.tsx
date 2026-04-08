import { ThemeProvider }  from "@/app/providers/ThemeProvider";
import { AuthProvider }   from "@/app/providers/AuthProvider";
import { NetworkProvider } from "@/app/providers/NetworkProvider";
import { AppRouter }      from "@/app/router";
import { GlobalErrorBoundary } from "@/components/common/GlobalErrorBoundary";

export default function App() {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <AuthProvider>
          <GlobalErrorBoundary>
            <AppRouter />
          </GlobalErrorBoundary>
        </AuthProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
}
