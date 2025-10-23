import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { GenerateRecipeForm } from "./GenerateRecipeForm";
import { useGenerateRecipe } from "./useGenerateRecipe";
import type { GenerateRecipeFormViewModel } from "./schema";

interface GenerateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestsRemaining: number;
  onGenerationSuccess: (newCount: number) => void;
}

/**
 * Modal component for AI recipe generation.
 * Manages the form submission flow, API communication, and navigation.
 *
 * Flow:
 * 1. User fills the form and submits
 * 2. Hook calls API and saves data to sessionStorage
 * 3. On success: Close modal and redirect to /recipes/new
 * 4. On error: Show toast with error message, keep modal open
 */
export function GenerateRecipeModal({
  isOpen,
  onClose,
  requestsRemaining,
  onGenerationSuccess,
}: GenerateRecipeModalProps) {
  const { isGenerating, error, generateRecipe } = useGenerateRecipe();

  /**
   * Handles form submission.
   * Calls the API to generate a recipe, then navigates on success.
   */
  const handleFormSubmit = useCallback(
    async (data: GenerateRecipeFormViewModel) => {
      // Early return if no requests remaining
      if (requestsRemaining <= 0) {
        toast.error("Osiągnąłeś dzienny limit zapytań AI. Spróbuj jutro.");
        return;
      }

      const result = await generateRecipe(data);

      // On error, hook already set error state
      if (!result) {
        if (error) {
          toast.error(error);
        }
        return;
      }

      // Success: Close modal and navigate
      toast.success("Przepis został wygenerowany! Przechodzę do formularza...");
      onClose();
      onGenerationSuccess(requestsRemaining - 1);

      // Navigate to recipe form with generated data in sessionStorage
      setTimeout(() => {
        window.location.href = "/recipes/new";
      }, 500);
    },
    [requestsRemaining, generateRecipe, error, onClose, onGenerationSuccess]
  );

  /**
   * Display error toast when error state changes
   */
  useEffect(() => {
    if (error && !isGenerating) {
      toast.error(error);
    }
  }, [error, isGenerating]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generuj przepis z AI</DialogTitle>
          <DialogDescription>
            Określ parametry pożądanego przepisu, a sztuczna inteligencja wygeneruje dla Ciebie idealny przepis
            dostosowany do Twoich preferencji.
          </DialogDescription>
        </DialogHeader>

        {/* Limit reached message */}
        {requestsRemaining <= 0 && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              Osiągnąłeś dzienny limit zapytań AI. Spróbuj ponownie jutro o północy.
            </p>
          </div>
        )}

        {/* Form */}
        <GenerateRecipeForm
          onSubmit={handleFormSubmit}
          isSubmitting={isGenerating}
          requestsRemaining={requestsRemaining}
        />

        {/* Requests remaining info */}
        <p className="text-xs text-muted-foreground text-center">{requestsRemaining} zapytań pozostało dzisiaj</p>
      </DialogContent>
    </Dialog>
  );
}
