import { useCallback, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

interface NavbarProps {
  readonly user: {
    readonly id: string;
    readonly email: string;
  };
}

export function Navbar({ user }: NavbarProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogout = useCallback(() => {
    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          const message = payload?.error ?? "Nie udało się wylogować.";
          setError(message);
          return;
        }

        window.location.assign("/login");
      } catch (logoutError) {
        console.error("Logout failed", logoutError);
        setError("Wystąpił problem z wylogowaniem. Spróbuj ponownie.");
      }
    });
  }, []);

  const statusMessage = useMemo(() => {
    if (isPending) {
      return "Wylogowuję...";
    }

    if (error) {
      return error;
    }

    return null;
  }, [error, isPending]);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full container items-center justify-between">
        <a
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          HealthyMeal
        </a>

        <nav className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {user.email}
          </span>

          <Button type="button" onClick={() => window.location.assign("/preferences")} variant="outline">
            Preferencje
          </Button>

          <Button type="button" onClick={handleLogout} disabled={isPending} variant="destructive">
            Wyloguj
          </Button>
        </nav>
      </div>

      {statusMessage ? (
        <div className="border-t bg-destructive/10 py-2">
          <p className="mx-auto max-w-6xl px-4 text-sm text-destructive" role="status">
            {statusMessage}
          </p>
        </div>
      ) : null}
    </header>
  );
}
