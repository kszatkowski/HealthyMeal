import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { RecipeDeleteDialog } from "./RecipeDeleteDialog";
import { useDeleteRecipe } from "./useDeleteRecipe";
import { Edit2, Trash2 } from "lucide-react";

interface RecipeActionsProps {
  recipeId: string;
  recipeName: string;
}

function RecipeActionsComponent({ recipeId, recipeName }: RecipeActionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { deleteRecipe, isPending } = useDeleteRecipe();

  const handleEdit = () => {
    window.location.href = `/recipes/${recipeId}/edit`;
  };

  const handleDelete = async () => {
    try {
      await deleteRecipe(recipeId);
      setIsDialogOpen(false);

      window.location.href = "/";
    } catch {
      // Error handling is done in the hook with toast notification
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          onClick={handleEdit}
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 hover:bg-secondary"
          title="Edytuj przepis"
          aria-label="Edytuj przepis"
          disabled={isPending}
        >
          <Edit2 className="size-4" />
        </Button>
        <Button
          onClick={() => setIsDialogOpen(true)}
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive"
          title="Usuń przepis"
          aria-label="Usuń przepis"
          disabled={isPending}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <RecipeDeleteDialog
        recipeName={recipeName}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleDelete}
        isPending={isPending}
      />
    </>
  );
}

export default memo(RecipeActionsComponent);
