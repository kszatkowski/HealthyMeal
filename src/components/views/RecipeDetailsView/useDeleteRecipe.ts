import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseDeleteRecipeResult {
  deleteRecipe: (recipeId: string) => Promise<void>;
  isPending: boolean;
  error: Error | null;
}

export function useDeleteRecipe(): UseDeleteRecipeResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteRecipe = useCallback(
    async (recipeId: string): Promise<void> => {
      // Prevent duplicate requests
      if (isPending) {
        return;
      }

      try {
        setIsPending(true);
        setError(null);

        // Validate recipeId format
        if (!recipeId || typeof recipeId !== "string") {
          throw new Error("Nieprawidłowy ID przepisu.");
        }

        const response = await fetch(`/api/recipes/${recipeId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorMessage = "Nie udało się usunąć przepisu.";

          if (response.status >= 500) {
            toast.error("Błąd serwera. Spróbuj ponownie później.");
          } else if (response.status === 404) {
            toast.error("Przepis nie znaleziony.");
          } else if (response.status === 401) {
            toast.error("Brak uprawnień do usunięcia tego przepisu.");
          } else {
            toast.error(errorMessage);
          }

          const err = new Error(errorMessage);
          setError(err);
          throw err;
        }

        toast.success("Przepis został usunięty.");
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Nieznany błąd");
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [isPending]
  );

  return {
    deleteRecipe,
    isPending,
    error,
  };
}
