import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ThemeContext, type Theme } from "@/app/providers/ThemeContext";

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem("worknest-theme") as Theme | null;
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: Theme) {
  try {
    window.localStorage.setItem("worknest-theme", theme);
  } catch {
    // Browser storage can be unavailable in restricted/private modes.
  }
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = readStoredTheme();
  if (stored) return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    writeStoredTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setThemeMode = useCallback((nextTheme: Theme) => {
    setTheme(nextTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
