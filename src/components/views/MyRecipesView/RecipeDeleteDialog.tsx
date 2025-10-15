import { useState } from "react";

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

interface RecipeDeleteDialogProps {
  recipeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
}

export function RecipeDeleteDialog({ recipeName, open, onOpenChange, onConfirm }: RecipeDeleteDialogProps) {
  const [isPending, setIsPending] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć ten przepis?</AlertDialogTitle>
          <AlertDialogDescription>
            Operacja usunie przepis <span className="font-semibold text-foreground">{recipeName}</span>. Tego działania
            nie można cofnąć.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
            disabled={isPending}
            onClick={async () => {
              if (isPending) {
                return;
              }

              try {
                setIsPending(true);
                await onConfirm();
                onOpenChange(false);
              } catch (error) {
                console.error("Failed to delete recipe", { error });
              } finally {
                setIsPending(false);
              }
            }}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Usuwanie...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Trash2 className="size-4" aria-hidden="true" />
                Usuń
              </span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
