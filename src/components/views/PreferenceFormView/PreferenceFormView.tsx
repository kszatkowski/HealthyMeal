import { useCallback, useEffect, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { updateProfileSchema, type UpdateProfileInput } from "@/lib/schemas/profile.schema";
import type { ProfileResponseDto } from "@/types";

interface PreferenceFormViewProps {
  readonly className?: string;
}

export function PreferenceFormView({ className }: PreferenceFormViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      dislikedIngredientsNote: null,
      allergensNote: null,
    },
    mode: "onTouched",
  });

  const { watch, handleSubmit, reset } = form;

  // Watch the current values to display character count
  const dislikedIngredientsNote = watch("dislikedIngredientsNote");
  const allergensNote = watch("allergensNote");

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/profile", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Failed to load profile");
        }

        const profile: ProfileResponseDto = await response.json();
        reset({
          dislikedIngredientsNote: profile.dislikedIngredientsNote,
          allergensNote: profile.allergensNote,
        });
      } catch (error) {
        console.error("Failed to load profile", error);
        toast.error("Nie udało się załadować preferencji.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [reset]);

  const onSubmit = useCallback(
    async (data: UpdateProfileInput) => {
      if (isSaving) return;

      try {
        setIsSaving(true);
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
          throw new Error(errorData?.error?.message || "Failed to update preferences");
        }

        const updatedProfile: ProfileResponseDto = await response.json();
        reset({
          dislikedIngredientsNote: updatedProfile.dislikedIngredientsNote,
          allergensNote: updatedProfile.allergensNote,
        });

        toast.success("Twoje preferencje zostały zapisane.");
      } catch (error) {
        console.error("Failed to update preferences", error);
        toast.error(error instanceof Error ? error.message : "Nie udało się zaktualizować preferencji.");
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, reset]
  );

  const onError = useCallback((errors: FieldErrors<UpdateProfileInput>) => {
    console.error("Form validation errors", errors);
    toast.error("Przynajmniej jedno pole preferencji musi być wypełnione.");
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Ładowanie preferencji...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit, onError)} className={`space-y-6 ${className || ""}`}>
        <div className="grid gap-6 rounded-lg border border-border bg-card p-6 shadow-sm sm:grid-cols-2">
          {/* Disliked Ingredients */}
          <FormField
            control={form.control}
            name="dislikedIngredientsNote"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="font-semibold">Nie lubię / Unikam</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="np. seler naciowy, tofu, oliwa z oliwek"
                    className="min-h-32 resize-none"
                    maxLength={200}
                    aria-describedby="disliked-char-count"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <p id="disliked-char-count">{dislikedIngredientsNote?.length ?? 0} / 200 znaków</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Wpisz produkty oddzielone przecinkami</p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Allergens */}
          <FormField
            control={form.control}
            name="allergensNote"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="font-semibold">Alergeny</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="np. orzechy, mleko, gluten"
                    className="min-h-32 resize-none"
                    maxLength={200}
                    aria-describedby="allergens-char-count"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <p id="allergens-char-count">{allergensNote?.length ?? 0} / 200 znaków</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Wpisz alergeny oddzielone przecinkami</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="min-w-32">
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Zapisywanie...
              </span>
            ) : (
              "Zapisz preferencje"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
