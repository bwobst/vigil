import { createContext, useContext, useEffect, useState } from "react";
import {
  type ThemeMode,
  readStored,
  resolveEffective,
  writeStored,
} from "@/lib/theme";

interface ThemeContextValue {
  storedMode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [storedMode, setStoredMode] = useState<ThemeMode>(readStored);

  useEffect(() => {
    function apply(mode: ThemeMode) {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const effective = resolveEffective(mode, prefersDark);
      document.documentElement.classList.toggle("dark", effective === "dark");
      document.documentElement.style.colorScheme = effective;
    }

    apply(storedMode);

    if (storedMode !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => apply("system");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [storedMode]);

  function setMode(mode: ThemeMode) {
    setStoredMode(mode);
    writeStored(mode);
  }

  return (
    <ThemeContext.Provider value={{ storedMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
