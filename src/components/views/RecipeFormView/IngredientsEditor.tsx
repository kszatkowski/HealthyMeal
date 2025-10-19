import { useMemo } from "react";
import type {
  Control,
  FieldError,
  FieldErrorsImpl,
  Merge,
  UseFieldArrayReturn,
  UseFormSetValue,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductListItemDto } from "@/types";

import { ProductSearchInput } from "./ProductSearchInput";
import { MAX_INGREDIENTS, UNIT_LABELS, UNITS } from "./constants";
import type { RecipeFormViewModel } from "./schema";
import { createEmptyIngredient } from "./schema";

type IngredientErrorItem = Merge<FieldError, FieldErrorsImpl<RecipeFormViewModel["ingredients"][number]>>;

type IngredientErrors =
  | FieldError
  | IngredientErrorItem[]
  | (FieldError & { message?: string })
  | FieldErrorsImpl<RecipeFormViewModel["ingredients"]>
  | undefined;

interface IngredientsEditorProps {
  fieldArray: UseFieldArrayReturn<RecipeFormViewModel, "ingredients">;
  control: Control<RecipeFormViewModel>;
  errors: IngredientErrors;
  setValue: UseFormSetValue<RecipeFormViewModel>;
  values: RecipeFormViewModel["ingredients"];
  isSubmitting: boolean;
}

export function IngredientsEditor({
  fieldArray,
  control,
  errors,
  setValue,
  values,
  isSubmitting,
}: IngredientsEditorProps) {
  const parsedErrors = errors as IngredientErrors;

  const arrayErrorMessage = useMemo(() => {
    if (!parsedErrors || Array.isArray(parsedErrors)) {
      return undefined;
    }

    if (typeof parsedErrors === "object" && "message" in parsedErrors && typeof parsedErrors.message === "string") {
      return parsedErrors.message;
    }

    return undefined;
  }, [parsedErrors]);

  const ingredientErrors = Array.isArray(parsedErrors) ? parsedErrors : undefined;

  return (
    <section className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 shadow-sm">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-foreground">Składniki</h2>
          <p className="text-sm text-muted-foreground">
            Dodaj produkty wraz z ilościami i jednostkami potrzebnymi do przygotowania przepisu.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => fieldArray.append(createEmptyIngredient())}
          variant="outline"
          size="sm"
          disabled={isSubmitting || fieldArray.fields.length >= MAX_INGREDIENTS}
        >
          Dodaj składnik
        </Button>
      </header>

      <div className="flex flex-col gap-4">
        {fieldArray.fields.map((field, index) => {
          const ingredientError = ingredientErrors?.[index];
          const productError =
            ingredientError && typeof ingredientError === "object" ? ingredientError.productId : undefined;
          const productNameError =
            ingredientError && typeof ingredientError === "object" ? ingredientError.productName : undefined;
          const amountError =
            ingredientError && typeof ingredientError === "object" ? ingredientError.amount : undefined;
          const unitError = ingredientError && typeof ingredientError === "object" ? ingredientError.unit : undefined;

          const selectedProduct: ProductListItemDto | null = (() => {
            const current = values?.[index];
            if (current?.productId && current?.productName) {
              return { id: current.productId, name: current.productName };
            }
            return null;
          })();

          return (
            <div
              key={field.id}
              className="flex flex-col gap-4 rounded-md border border-border/70 bg-background/60 p-4 shadow-sm"
            >
              <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <FormField
                  control={control}
                  name={`ingredients.${index}.productId`}
                  render={({ field: productField }) => (
                    <FormItem>
                      <FormLabel>Produkt</FormLabel>
                      <FormControl>
                        <ProductSearchInput
                          value={selectedProduct}
                          onChange={(item) => {
                            productField.onChange(item?.id ?? "");
                            setValue(`ingredients.${index}.productName`, item?.name ?? "", {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          onBlur={productField.onBlur}
                          disabled={isSubmitting}
                          aria-invalid={productError || productNameError ? "true" : undefined}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`ingredients.${index}.amount`}
                  render={({ field: amountField }) => (
                    <FormItem>
                      <FormLabel>Ilość</FormLabel>
                      <FormControl>
                        <Input
                          {...amountField}
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min={0}
                          disabled={isSubmitting}
                          aria-invalid={amountError ? "true" : undefined}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`ingredients.${index}.unit`}
                  render={({ field: unitField }) => (
                    <FormItem>
                      <FormLabel>Jednostka</FormLabel>
                      <FormControl>
                        <Select value={unitField.value} onValueChange={unitField.onChange} disabled={isSubmitting}>
                          <SelectTrigger aria-invalid={unitError ? "true" : undefined}>
                            <SelectValue placeholder="Wybierz" />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {UNIT_LABELS[unit]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => fieldArray.remove(index)}
                  disabled={isSubmitting || fieldArray.fields.length <= 1}
                >
                  Usuń składnik
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {arrayErrorMessage ? (
        <p className="text-destructive text-sm font-medium" role="alert">
          {arrayErrorMessage}
        </p>
      ) : null}
    </section>
  );
}
