import { useCallback, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import type { RecipeCreateCommand } from "@/types";

import { IngredientsEditor } from "./IngredientsEditor";
import { defaultRecipeFormValues, recipeFormSchema } from "./schema";
import type { RecipeFormViewModel } from "./schema";

type IngredientErrors = NonNullable<Parameters<typeof IngredientsEditor>[0]["errors"]>;

function toCreateCommand(data: RecipeFormViewModel): RecipeCreateCommand {
  return {
    name: data.name.trim(),
    mealType: data.mealType,
    difficulty: data.difficulty,
    instructions: data.instructions.trim(),
    ingredients: data.ingredients.map((ingredient: RecipeFormViewModel["ingredients"][number]) => ({
      productId: ingredient.productId,
      amount: ingredient.amount,
      unit: ingredient.unit,
    })),
  };
}

const navigateToRecipes = () => {
  window.location.href = "/";
};

export function RecipeForm() {
  const [hasMountedToaster, setHasMountedToaster] = useState(false);

  const form = useForm<RecipeFormViewModel>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: defaultRecipeFormValues,
    mode: "onTouched",
  });

  const { control, handleSubmit, formState, reset } = form;

  const ingredientArray = useFieldArray({ name: "ingredients", control });

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
        const response = await fetch("/api/recipes", {
          method: "POST",
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

              return "Nie udało się zapisać przepisu.";
            })
            .catch(() => "Nie udało się zapisać przepisu.");

          toast.error(message);
          return;
        }

        toast.success("Przepis został zapisany");
        reset(defaultRecipeFormValues);
        setTimeout(navigateToRecipes, 1000);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nie udało się zapisać przepisu.";
        toast.error(message);
      }
    },
    [ensureToasterMounted, reset]
  );

  const disableSubmit = formState.isSubmitting;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-12">
      {hasMountedToaster ? <Toaster richColors closeButton position="top-center" /> : null}

      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold text-foreground">Dodaj nowy przepis</h1>
            <p className="text-muted-foreground">
              Wypełnij poniższe pola, aby ręcznie dodać przepis do swojej kolekcji.
            </p>
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
                    <Input placeholder="np. Sałatka z kurczakiem" {...field} />
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
                        <SelectTrigger aria-label="Rodzaj posiłku">
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
                        <SelectTrigger aria-label="Poziom trudności">
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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <IngredientsEditor
            fieldArray={ingredientArray}
            control={control}
            errors={formState.errors.ingredients as IngredientErrors}
            setValue={form.setValue}
            values={form.watch("ingredients")}
            isSubmitting={disableSubmit}
          />

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
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={disableSubmit}>
              {disableSubmit ? "Zapisywanie..." : "Zapisz przepis"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
