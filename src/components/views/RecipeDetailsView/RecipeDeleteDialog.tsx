import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { memo } from "react";

interface RecipeDeleteDialogProps {
  recipeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

function RecipeDeleteDialogComponent({
  recipeName,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: RecipeDeleteDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch {
      // Error handling is done in the parent hook
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" aria-hidden="true" />
            Usunąć ten przepis?
          </AlertDialogTitle>
          <AlertDialogDescription className="pt-2">
            Przepis <span className="font-semibold text-foreground">{recipeName}</span> zostanie na stałe usunięty. Tej
            operacji nie można cofnąć.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 pt-4">
          <AlertDialogCancel disabled={isPending} className="sm:w-auto">
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Usuwanie...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Trash2 className="size-4" aria-hidden="true" />
                Usuń na stałe
              </span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const RecipeDeleteDialog = memo(RecipeDeleteDialogComponent);
