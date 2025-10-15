import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

import type { RecipeListItemDto } from "../../../types.ts";
import { EmptyState } from "./EmptyState";
import { RecipeCard } from "./RecipeCard";
import { Spinner } from "@/components/ui/spinner";

interface RecipesListProps extends ComponentPropsWithoutRef<"div"> {
  recipes: RecipeListItemDto[];
  isLoading: boolean;
  error: Error | null;
  onDelete: (recipeId: string) => Promise<void> | void;
  onRetry?: () => void;
}

export function RecipesList({ recipes, isLoading, error, onDelete, onRetry, className, ...props }: RecipesListProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)} {...props}>
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Nie udało się pobrać przepisów"
        description={error.message || "Spróbuj ponownie za chwilę."}
        actionLabel="Spróbuj ponownie"
        onAction={onRetry}
        className={className}
        {...props}
      />
    );
  }

  if (recipes.length === 0) {
    return (
      <EmptyState
        title="Nie masz jeszcze żadnych przepisów"
        description="Dodaj swój pierwszy przepis lub skorzystaj z generatora AI, aby uzyskać inspirację."
        actionLabel="Dodaj przepis"
        actionHref="/recipes/new"
        className={className}
        {...props}
      />
    );
  }

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)} {...props}>
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} onDelete={onDelete} />
      ))}
    </div>
  );
}
