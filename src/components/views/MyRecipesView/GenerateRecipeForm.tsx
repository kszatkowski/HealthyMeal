import { useCallback } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

import { DIFFICULTY_LABELS, MEAL_TYPE_LABELS } from "@/lib/constants";
import { DIFFICULTIES, MEAL_TYPES } from "@/components/views/RecipeFormView/constants";

import { generateRecipeFormSchema, defaultGenerateRecipeFormValues, type GenerateRecipeFormViewModel } from "./schema";

interface GenerateRecipeFormProps {
  onSubmit: (data: GenerateRecipeFormViewModel) => void;
  isSubmitting: boolean;
  requestsRemaining: number;
}

/**
 * Form component for AI recipe generation.
 * Allows users to specify:
 * - Meal type (required)
 * - Main ingredient (optional)
 * - Difficulty level (optional)
 */
export function GenerateRecipeForm({ onSubmit, isSubmitting, requestsRemaining }: GenerateRecipeFormProps) {
  const isDisabled = isSubmitting || requestsRemaining <= 0;

  const form = useForm<GenerateRecipeFormViewModel>({
    resolver: zodResolver(generateRecipeFormSchema),
    defaultValues: defaultGenerateRecipeFormValues,
    mode: "onTouched",
  });

  const { control, handleSubmit } = form;

  const handleFormSubmit = useCallback<SubmitHandler<GenerateRecipeFormViewModel>>(
    (data) => {
      onSubmit(data);
    },
    [onSubmit]
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
        {/* Meal Type Field - Required */}
        <FormField
          control={control}
          name="mealType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Rodzaj posiłku <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                  <SelectTrigger aria-label="Rodzaj posiłku">
                    <SelectValue placeholder="Wybierz rodzaj posiłku" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPES.map((mealType) => (
                      <SelectItem key={mealType} value={mealType}>
                        {MEAL_TYPE_LABELS[mealType] || mealType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Main Ingredient Field - Optional */}
        <FormField
          control={control}
          name="mainIngredient"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Główny składnik (opcjonalnie)</FormLabel>
              <FormControl>
                <Input placeholder="np. kurczak, ryba, warzywa..." disabled={isDisabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Difficulty Field - Optional */}
        <FormField
          control={control}
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poziom trudności (opcjonalnie)</FormLabel>
              <FormControl>
                <Select
                  value={field.value || ""}
                  onValueChange={(value) => field.onChange(value === "" ? undefined : value)}
                  disabled={isDisabled}
                >
                  <SelectTrigger aria-label="Poziom trudności">
                    <SelectValue placeholder="Wybierz poziom (opcjonalnie)" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {DIFFICULTY_LABELS[difficulty] || difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isDisabled} className="mt-2 w-full">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner className="size-4" />
              Generowanie...
            </span>
          ) : (
            "Generuj przepis"
          )}
        </Button>

        {/* Requests Limit Warning */}
        {requestsRemaining <= 0 && (
          <p className="text-sm text-destructive">Osiągnąłeś dzienny limit zapytań AI. Spróbuj jutro.</p>
        )}
      </form>
    </Form>
  );
}
