import { ThemeProvider }  from "@/app/providers/ThemeProvider";
import { AuthProvider }   from "@/app/providers/AuthProvider";
import { AppRouter }      from "@/app/router";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}
