import { createRootRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { useSession, useSignOut } from "@/api/session";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { data: session } = useSession();
  const signOut = useSignOut();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut.mutate(undefined, {
      onSuccess: () => void navigate({ to: "/sign-in" }),
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center gap-6">
          <Link to="/" className="text-lg font-bold text-emerald-600">
            Vigil
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link to="/">Home</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              {session && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link to="/watches">Watches</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link to="/about">About</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          {session && (
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{session.email}</span>
              <Link to="/change-password" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Change password
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={signOut.isPending}
              >
                Sign out
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
