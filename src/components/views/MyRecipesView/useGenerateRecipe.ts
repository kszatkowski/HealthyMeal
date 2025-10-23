import { useCallback, useState } from "react";
import type { GenerateRecipeFormViewModel } from "./schema";
import type { RecipeUpdateCommand } from "@/types";

interface UseGenerateRecipeResult {
  isGenerating: boolean;
  error: string | null;
  generateRecipe: (formData: GenerateRecipeFormViewModel) => Promise<RecipeUpdateCommand | null>;
}

const SESSION_STORAGE_KEY = "ai-generated-recipe";

/**
 * Custom hook for managing AI recipe generation.
 * Handles API communication, state management, and sessionStorage persistence.
 */
export function useGenerateRecipe(): UseGenerateRecipeResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Constructs a natural language prompt from the form data.
   * Example: "Create an easy breakfast recipe, with chicken as main ingredient."
   */
  const buildPrompt = useCallback((data: GenerateRecipeFormViewModel): string => {
    const difficulty = data.difficulty ?? "any";
    const mainIngredient = data.mainIngredient?.trim() ? data.mainIngredient : "any main ingredient";

    return `Jesteś doświadczonym kucharzem. Twoim zadaniem jest stworzenie przepisu na ${data.mealType}.
Zwróć uwagę, aby w przepisie nie było składników których nie lubię, a są to: oliwki.
Pamiętaj aby stworzony przez ciebie przepis nie zawierał alergenów: nabiał.
Głównym składnikiem przepisu powinien być: ${mainIngredient}.
Stopień trudności przepisu powinien być na poziomie ${difficulty}.
Wygeneruj przepis zawierający instrukcję do 5000 znaków.
Składniki powinny być w formacie: nazwa_składnika ilosc jednostka np. Mleko 1 szklanka. Pamiętaj aby po każdym składniku był znak nowej linii.
Typ posiłku musi być jednym z: breakfast, lunch, dinner, dessert, snack.
Poziom trudności musi być jednym z: easy, medium, hard.`;
  }, []);

  /**
   * Generates a recipe by calling the API and managing the generation process.
   * On success: Saves recipe data to sessionStorage and returns it.
   * On error: Sets error state and returns null.
   */
  const generateRecipe = useCallback(
    async (formData: GenerateRecipeFormViewModel): Promise<RecipeUpdateCommand | null> => {
      // Guard: Check if already generating
      if (isGenerating) {
        return null;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const prompt = buildPrompt(formData);

        const response = await fetch("/api/recipes/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ prompt }),
        });

        // Handle API errors
        if (!response.ok) {
          const responseData = (await response.json().catch(() => null)) as unknown;
          let errorMessage = "Nie udało się wygenerować przepisu.";

          // Extract error message from API response
          if (
            responseData &&
            typeof responseData === "object" &&
            "error" in responseData &&
            typeof (responseData as { error?: unknown }).error === "string"
          ) {
            errorMessage = (responseData as { error: string }).error;
          }

          setError(errorMessage);
          return null;
        }

        // Parse success response
        const data = (await response.json()) as unknown;

        // Validate response structure
        // The API returns: { success: true, data: {...}, aiRequestsRemaining: number }
        if (!data || typeof data !== "object" || !("data" in data) || !("aiRequestsRemaining" in data)) {
          setError("Nieprawidłowa odpowiedź serwera.");
          return null;
        }

        const responseData = data as { success?: boolean; data: RecipeUpdateCommand; aiRequestsRemaining: number };
        const recipeData = responseData.data;

        // Save generated recipe to sessionStorage for use in the form
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(recipeData));
        } catch {
          // Continue anyway - the generation succeeded, just the storage failed
        }

        return recipeData;
      } catch (fetchError) {
        // Handle network errors and other exceptions
        const message = fetchError instanceof Error ? fetchError.message : "Błąd sieci. Spróbuj ponownie.";
        setError(message);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, buildPrompt]
  );

  return {
    isGenerating,
    error,
    generateRecipe,
  };
}
