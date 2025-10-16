import { useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string({ required_error: "Adres e-mail jest wymagany." }).email("Nieprawidłowy format adresu e-mail."),
  password: z.string({ required_error: "Hasło jest wymagane." }).min(1, "Hasło jest wymagane."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      // TODO: Integrate with POST /api/auth/login endpoint when backend is ready.
    } catch (submitError) {
      setError("Nie udało się zalogować. Spróbuj ponownie później.");
    } finally {
      setIsSubmitting(false);
    }
  });

  const footerMessage = useMemo(() => {
    if (isSubmitting) {
      return "Trwa logowanie...";
    }

    if (error) {
      return error;
    }

    return null;
  }, [error, isSubmitting]);

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
