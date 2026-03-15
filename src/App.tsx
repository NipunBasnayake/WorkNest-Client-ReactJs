import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { AppRouter } from "@/app/router";

export default function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  );
}
