import type { ReactNode } from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import type { ThemeMode } from "@/lib/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const THEME_ICONS: Record<ThemeMode, ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
};

const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const MODES: ThemeMode[] = ["light", "dark", "system"];

export function ThemePreferenceRows({
  storedMode,
  setMode,
}: {
  storedMode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}) {
  return (
    <>
      {MODES.map((mode) => (
        <DropdownMenuItem
          key={mode}
          onClick={() => setMode(mode)}
          className="flex items-center gap-2"
        >
          {THEME_ICONS[mode]}
          <span className="flex-1">{THEME_LABELS[mode]}</span>
          {mode === "system" && (
            <span className="text-xs text-muted-foreground">Device</span>
          )}
          {storedMode === mode && (
            <Check className="h-3.5 w-3.5 text-foreground" aria-hidden="true" />
          )}
        </DropdownMenuItem>
      ))}
    </>
  );
}

export function ThemeMenu() {
  const { storedMode, setMode } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Theme: ${THEME_LABELS[storedMode]}`}
        >
          {THEME_ICONS[storedMode]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ThemePreferenceRows storedMode={storedMode} setMode={setMode} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
