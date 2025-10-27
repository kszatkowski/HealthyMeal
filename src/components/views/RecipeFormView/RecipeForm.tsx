import { useCallback, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import type { RecipeCreateCommand, RecipeResponseDto } from "@/types";

import { defaultRecipeFormValues, recipeFormSchema } from "./schema";
import type { RecipeFormViewModel } from "./schema";

interface RecipeFormProps {
  recipeId?: string;
  initialData?: RecipeResponseDto;
}

function toCreateCommand(data: RecipeFormViewModel): RecipeCreateCommand {
  return {
    name: data.name.trim(),
    mealType: data.mealType,
    difficulty: data.difficulty,
    instructions: data.instructions.trim(),
    ingredients: data.ingredients.trim(),
    isAiGenerated: data.isAiGenerated,
  };
}

const navigateToRecipes = () => {
  window.location.href = "/";
};

// Session storage key for AI-generated recipes
const SESSION_STORAGE_KEY = "ai-generated-recipe";

export function RecipeForm({ recipeId, initialData }: RecipeFormProps) {
  const [hasMountedToaster, setHasMountedToaster] = useState(false);
  const isEditMode = !!recipeId && !!initialData;

  // Convert initial data to form values if editing or load from sessionStorage
  const getInitialValues = useCallback((): RecipeFormViewModel => {
    // First, try to load from sessionStorage (AI-generated recipe)
    if (typeof window !== "undefined") {
      try {
        const storedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData) as unknown;
          // Validate that it has the expected structure
          if (
            parsedData &&
            typeof parsedData === "object" &&
            "name" in parsedData &&
            "mealType" in parsedData &&
            "difficulty" in parsedData &&
            "instructions" in parsedData &&
            "ingredients" in parsedData
          ) {
            const data = parsedData as RecipeFormViewModel;
            // Clear sessionStorage after loading
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            return data;
          }
        }
      } catch (error) {
        console.warn("Failed to parse AI recipe from sessionStorage", { error });
      }
    }

    // Then, check if editing existing recipe
    if (isEditMode && initialData) {
      return {
        name: initialData.name,
        mealType: initialData.mealType,
        difficulty: initialData.difficulty,
        instructions: initialData.instructions,
        ingredients: initialData.ingredients,
        isAiGenerated: initialData.isAiGenerated,
      };
    }

    // Default empty form
    return defaultRecipeFormValues;
  }, [isEditMode, initialData]);

  const form = useForm<RecipeFormViewModel>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: getInitialValues(),
    mode: "onTouched",
  });

  const { control, handleSubmit, formState, reset } = form;

  const ensureToasterMounted = useCallback(() => {
    if (!hasMountedToaster) {
      setHasMountedToaster(true);
    }
  }, [hasMountedToaster]);

  const onSubmit = useCallback<SubmitHandler<RecipeFormViewModel>>(
    async (data) => {
      ensureToasterMounted();

      try {
        const payload = toCreateCommand(data);
        const method = isEditMode ? "PUT" : "POST";
        const endpoint = isEditMode ? `/api/recipes/${recipeId}` : "/api/recipes";

        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const message = await response
            .json()
            .then((body: unknown) => {
              if (
                body &&
                typeof body === "object" &&
                "error" in body &&
                body.error &&
                typeof body.error === "object" &&
                body.error !== null &&
                "message" in body.error &&
                typeof (body as { error: { message?: unknown } }).error.message === "string"
              ) {
                return (body as { error: { message: string } }).error.message;
              }

              return isEditMode ? "Nie udało się zaktualizować przepisu." : "Nie udało się zapisać przepisu.";
            })
            .catch(() => (isEditMode ? "Nie udało się zaktualizować przepisu." : "Nie udało się zapisać przepisu."));

          toast.error(message);
          return;
        }

        const successMessage = isEditMode ? "Przepis został zaktualizowany" : "Przepis został zapisany";
        toast.success(successMessage);
        reset(defaultRecipeFormValues);
        setTimeout(navigateToRecipes, 1000);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nie udało się przetwarzać żądania.";
        toast.error(message);
      }
    },
    [ensureToasterMounted, reset, isEditMode, recipeId]
  );

  const disableSubmit = formState.isSubmitting;
  const pageTitle = isEditMode ? "Edytuj przepis" : "Dodaj nowy przepis";
  const pageDescription = isEditMode
    ? "Zaktualizuj informacje o przepisie i jego składniki."
    : "Wypełnij poniższe pola, aby ręcznie dodać przepis do swojej kolekcji.";
  const submitButtonText = disableSubmit
    ? isEditMode
      ? "Aktualizowanie..."
      : "Zapisywanie..."
    : isEditMode
      ? "Aktualizuj przepis"
      : "Zapisz przepis";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-12">
      {hasMountedToaster ? <Toaster richColors closeButton position="top-center" /> : null}

      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold text-foreground" data-testid="recipe-form-page-title">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground">{pageDescription}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigateToRecipes();
              }
            }}
          >
            Anuluj
          </Button>
        </div>
      </header>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <section className="grid gap-4 rounded-lg border border-border bg-card p-6 shadow-sm">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa przepisu</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Sałatka z kurczakiem" {...field} data-testid="recipe-name-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="mealType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rodzaj posiłku</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger aria-label="Rodzaj posiłku" data-testid="recipe-meal-type-select">
                          <SelectValue placeholder="Wybierz rodzaj" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">Śniadanie</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Obiad</SelectItem>
                          <SelectItem value="dessert">Deser</SelectItem>
                          <SelectItem value="snack">Przekąska</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poziom trudności</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger aria-label="Poziom trudności" data-testid="recipe-difficulty-select">
                          <SelectValue placeholder="Wybierz poziom" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Łatwy</SelectItem>
                          <SelectItem value="medium">Średni</SelectItem>
                          <SelectItem value="hard">Trudny</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrukcje przygotowania</FormLabel>
                  <FormControl>
                    <textarea
                      className="h-48 w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground shadow-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Opisz krok po kroku proces przygotowania..."
                      data-testid="recipe-instructions-textarea"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Składniki</FormLabel>
                  <FormControl>
                    <textarea
                      className="h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground shadow-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Wymień składniki, np.:&#10;Mąka owsiana - 1 szklanka&#10;Mleko migdałowe - 1 szklanka&#10;Miód - 1 łyżka stołowa"
                      data-testid="recipe-ingredients-textarea"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="sm:hidden"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  navigateToRecipes();
                }
              }}
              disabled={disableSubmit}
              data-testid="recipe-form-cancel-button"
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={disableSubmit} data-testid="recipe-form-submit-button">
              {submitButtonText}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
