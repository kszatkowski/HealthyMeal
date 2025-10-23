import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface GenerateRecipeButtonProps {
  onOpen: () => void;
  requestsRemaining: number;
}

/**
 * Button component to trigger AI recipe generation.
 * Opens the GenerateRecipeModal when clicked.
 * Disabled when user has exhausted daily AI requests limit.
 */
export function GenerateRecipeButton({ onOpen, requestsRemaining }: GenerateRecipeButtonProps) {
  const isDisabled = requestsRemaining <= 0;

  return (
    <Button
      variant="outline"
      onClick={onOpen}
      disabled={isDisabled}
      className="sm:w-auto flex items-center gap-2"
      title={isDisabled ? "Osiągnąłeś dzienny limit zapytań AI" : "Generuj nowy przepis z AI"}
    >
      <Sparkles className="size-4" aria-hidden="true" />
      Generuj przepis z AI
    </Button>
  );
}
