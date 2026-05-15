import { useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Palette, KeyRound } from "lucide-react";
import { useSignOut } from "@/api/session";
import { ThemePreferenceRows } from "@/components/ThemeMenu";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { avatarHueFromEmail, initialsFromEmail } from "@/lib/email-initials";

type UserAccountMenuProps = {
  email: string;
};

export function UserAccountMenu({ email }: UserAccountMenuProps) {
  const signOut = useSignOut();
  const navigate = useNavigate();
  const { storedMode, setMode } = useTheme();

  const handleSignOut = useCallback(() => {
    signOut.mutate(undefined, {
      onSuccess: () => void navigate({ to: "/sign-in" }),
    });
  }, [navigate, signOut]);

  const initials = initialsFromEmail(email);
  const hue = avatarHueFromEmail(email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="relative h-9 w-9 rounded-full p-0 focus-visible:ring-offset-2"
          aria-label={`Account menu, signed in as ${email}`}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ring-1 ring-border"
            style={{ backgroundColor: `hsl(${hue}, 42%, 40%)` }}
            aria-hidden="true"
          >
            {initials}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <span className="truncate text-xs text-muted-foreground">Signed in as</span>
          <span className="block truncate text-sm text-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="h-4 w-4" aria-hidden="true" />
            Appearance
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <ThemePreferenceRows storedMode={storedMode} setMode={setMode} />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            to="/change-password"
            className="flex cursor-default items-center gap-2"
          >
            <KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />
            Change password
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={signOut.isPending}
          onClick={handleSignOut}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
