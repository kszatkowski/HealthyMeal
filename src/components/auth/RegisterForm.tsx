import { useMemo, useState, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RegisterSchema } from "@/lib/schemas/auth.schema";

const registerSchema = RegisterSchema.extend({
  confirmPassword: z.string({ required_error: "Potwierdzenie hasła jest wymagane." }),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Hasła muszą być identyczne.",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = "/";
    }
  }, [shouldRedirect]);

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...payload } = values;
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(result?.error ?? "Nie udało się utworzyć konta. Spróbuj ponownie później.");
        return;
      }

      setSuccessMessage("Konto zostało utworzone. Przekierowuję...");
      await new Promise((resolve) => setTimeout(resolve, 400));
      setShouldRedirect(true);
    } catch {
      setError("Nie udało się utworzyć konta. Spróbuj ponownie później.");
    } finally {
      setIsSubmitting(false);
    }
  });

  const footerMessage = useMemo(() => {
    if (isSubmitting) {
      return "Trwa rejestracja...";
    }

    if (successMessage) {
      return successMessage;
    }

    return null;
  }, [isSubmitting, successMessage]);

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Utwórz konto</CardTitle>
        <CardDescription>Rozpocznij planowanie zdrowych posiłków już dziś.</CardDescription>
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
                    <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potwierdź hasło</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" aria-hidden />
                  Tworzenie konta...
                </>
              ) : (
                "Utwórz konto"
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              Masz już konto?{" "}
              <a href="/login" className="font-medium text-primary hover:underline">
                Zaloguj się
              </a>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Rejestracja nie powiodła się</AlertTitle>
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
