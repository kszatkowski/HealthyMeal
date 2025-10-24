import { useMemo, useState, useCallback, useEffect } from "react";

import { cn } from "@/lib/utils";

import { MealTypeTabs } from "./MealTypeTabs";
import { OnboardingAlert } from "./OnboardingAlert";
import { Pagination } from "./Pagination";
import { RecipesList } from "./RecipesList";
import { RecipesToolbar } from "./RecipesToolbar";
import { GenerateRecipeModal } from "./GenerateRecipeModal";
import type { RecipeFiltersViewModel } from "./MyRecipesView.types.ts";
import { useRecipes } from "./useRecipes";
import { useProfile } from "./useProfile";
import { Toaster } from "@/components/ui/sonner";

export function MyRecipesView({ className }: { className?: string }) {
  const { recipes, pagination, filters, isLoading, error, updateFilters, deleteRecipe, reload } = useRecipes();
  const { profile, isLoading: isProfileLoading, refetch: refetchProfile } = useProfile();
  const [showOnboardingNotice, setShowOnboardingNotice] = useState(true);
  const [hasMountedToaster, setHasMountedToaster] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [localRequestsRemaining, setLocalRequestsRemaining] = useState<number | null>(null);

  const selectedMealType = filters.mealType ?? "all";
  // Use local override if available, otherwise use profile data
  const requestsRemaining = localRequestsRemaining !== null ? localRequestsRemaining : (profile?.aiRequestsCount ?? 0);

  // Clear local override when profile finishes loading to stay in sync with server
  useEffect(() => {
    if (!isProfileLoading && localRequestsRemaining !== null) {
      setLocalRequestsRemaining(null);
    }
  }, [isProfileLoading, localRequestsRemaining]);

  const handleMealTypeChange = (value: RecipeFiltersViewModel["mealType"] | "all") => {
    updateFilters({ mealType: value === "all" ? undefined : value });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const handleOpenGenerateModal = useCallback(() => {
    setIsGenerateModalOpen(true);
  }, []);

  const handleCloseGenerateModal = useCallback(() => {
    setIsGenerateModalOpen(false);
  }, []);

  /**
   * Called when recipe generation succeeds.
   * Immediately updates the local requests count and refetches profile for consistency.
   */
  const handleGenerationSuccess = useCallback(
    (newCount: number) => {
      // Update local state immediately for instant UI feedback
      setLocalRequestsRemaining(newCount);
      // Refetch profile to ensure consistency with server
      refetchProfile();
    },
    [refetchProfile]
  );

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

      <RecipesToolbar onGenerateRecipeClick={handleOpenGenerateModal} requestsRemaining={requestsRemaining} />

      <GenerateRecipeModal
        isOpen={isGenerateModalOpen}
        onClose={handleCloseGenerateModal}
        requestsRemaining={requestsRemaining}
        onGenerationSuccess={handleGenerationSuccess}
      />

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
