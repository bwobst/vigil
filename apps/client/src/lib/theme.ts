export type ThemeMode = "light" | "dark" | "system";

export const STORAGE_KEY = "vigil-theme";

export function normalizeMode(raw: unknown): ThemeMode {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

export function resolveEffective(
  stored: ThemeMode,
  prefersDark: boolean,
): "light" | "dark" {
  if (stored === "dark") return "dark";
  if (stored === "light") return "light";
  return prefersDark ? "dark" : "light";
}

export function readStored(): ThemeMode {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return "system";
  }
  const mode = normalizeMode(raw);
  if (raw !== mode) {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // storage not writable — ignore
    }
  }
  return mode;
}

export function writeStored(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // storage not writable — ignore
  }
}
