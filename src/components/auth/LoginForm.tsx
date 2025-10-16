import { useEffect, useMemo, useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoginSchema } from "@/lib/schemas/auth.schema";

type LoginFormValues = z.infer<typeof LoginSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = "/";
    }
  }, [shouldRedirect]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    mode: "onSubmit",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          const message = payload?.error ?? "Nieprawidłowy login lub hasło.";
          setError(message);
          return;
        }

        setSuccessMessage("Logowanie zakończone sukcesem. Przekierowuję...");
        await new Promise((resolve) => setTimeout(resolve, 400));
        setShouldRedirect(true);
      } catch (submitError) {
        console.error("Login failed", submitError);
        setError("Nie udało się zalogować. Spróbuj ponownie później.");
      }
    });
  });

  const footerMessage = useMemo(() => {
    if (isPending) {
      return "Trwa logowanie...";
    }

    if (successMessage) {
      return successMessage;
    }

    return null;
  }, [isPending, successMessage]);

  const isSubmitting = isPending || form.formState.isSubmitting;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>Uzyskaj dostęp do swoich ulubionych przepisów i planerów.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="grid gap-6" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="jan.kowalski@example.com" autoComplete="email" inputMode="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasło</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" aria-hidden />
                  Logowanie...
                </>
              ) : (
                "Zaloguj się"
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              Nie masz konta?{" "}
              <a href="/register" className="font-medium text-primary hover:underline">
                Utwórz konto
              </a>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Logowanie nie powiodło się</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {footerMessage ? (
              <p className="text-center text-sm text-muted-foreground" role="status">
                {footerMessage}
              </p>
            ) : null}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
