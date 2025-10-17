import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { MealTypeTabs } from "./MealTypeTabs";
import { OnboardingAlert } from "./OnboardingAlert";
import { Pagination } from "./Pagination";
import { RecipesList } from "./RecipesList";
import { RecipesToolbar } from "./RecipesToolbar";
import type { RecipeFiltersViewModel } from "./MyRecipesView.types.ts";
import { useRecipes } from "./useRecipes";
import { Toaster } from "@/components/ui/sonner";

export function MyRecipesView({ className }: { className?: string }) {
  const { recipes, pagination, filters, isLoading, error, updateFilters, deleteRecipe, reload } = useRecipes();
  const [showOnboardingNotice, setShowOnboardingNotice] = useState(true);
  const [hasMountedToaster, setHasMountedToaster] = useState(false);

  const selectedMealType = filters.mealType ?? "all";

  const handleMealTypeChange = (value: RecipeFiltersViewModel["mealType"] | "all") => {
    updateFilters({ mealType: value === "all" ? undefined : value });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const layoutClassName = useMemo(() => cn("flex flex-col gap-6", className), [className]);

  const ensureToasterMounted = () => {
    if (!hasMountedToaster) {
      setHasMountedToaster(true);
    }
  };

  return (
    <div className={layoutClassName}>
      {hasMountedToaster ? <Toaster richColors closeButton position="top-center" /> : null}

      <OnboardingAlert
        show={showOnboardingNotice}
        onDismiss={async () => {
          setShowOnboardingNotice(false);
          ensureToasterMounted();
        }}
        className="mt-6"
      />

      <RecipesToolbar />

      <MealTypeTabs currentValue={selectedMealType} onValueChange={handleMealTypeChange} />

      <RecipesList
        recipes={recipes}
        isLoading={isLoading}
        error={error}
        onDelete={async (id) => {
          ensureToasterMounted();
          await deleteRecipe(id);
        }}
        onRetry={() => {
          ensureToasterMounted();
          reload();
        }}
      />

      {pagination.total > 0 ? (
        <Pagination meta={pagination} currentPage={filters.page} onPageChange={handlePageChange} />
      ) : null}
    </div>
  );
}
