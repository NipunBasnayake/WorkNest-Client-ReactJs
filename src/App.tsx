import { ThemeProvider }  from "@/app/providers/ThemeProvider";
import { AuthProvider }   from "@/app/providers/AuthProvider";
import { NetworkProvider } from "@/app/providers/NetworkProvider";
import { AppRouter }      from "@/app/router";

export default function App() {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
}
