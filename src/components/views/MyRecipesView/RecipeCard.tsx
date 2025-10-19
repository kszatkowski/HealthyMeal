import { useState } from "react";
import { formatRelative } from "date-fns";
import { pl } from "date-fns/locale";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { RecipeListItemDto } from "../../../types.ts";

import { RecipeDeleteDialog } from "./RecipeDeleteDialog";

interface RecipeCardProps {
  recipe: RecipeListItemDto;
  onDelete: (recipeId: string) => Promise<void> | void;
}

const DIFFICULTY_LABELS: Record<RecipeListItemDto["difficulty"], string> = {
  easy: "Łatwy",
  medium: "Średni",
  hard: "Trudny",
};

const MEAL_TYPE_LABELS: Record<RecipeListItemDto["mealType"], string> = {
  breakfast: "Śniadanie",
  lunch: "Lunch",
  dinner: "Obiad",
  dessert: "Deser",
  snack: "Przekąska",
};

export function RecipeCard({ recipe, onDelete }: RecipeCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mealTypeLabel = MEAL_TYPE_LABELS[recipe.mealType];
  const difficultyLabel = DIFFICULTY_LABELS[recipe.difficulty];
  const updatedLabel = formatRelative(new Date(recipe.updatedAt), new Date(), { locale: pl });

  return (
    <>
      <Card
        asChild
        className="transition hover:border-primary/60 focus-within:border-primary/60 focus-within:shadow-md"
      >
        <a href={`/recipes/${recipe.id}`} className="outline-none">
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="line-clamp-2 text-base font-semibold text-foreground">{recipe.name}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={(event) => event.preventDefault()}
                  >
                    <MoreVertical className="size-4" aria-hidden="true" />
                    <span className="sr-only">Akcje przepisu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(event) => event.preventDefault()}>
                  <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                  <DropdownMenuItem onSelect={() => (window.location.href = `/recipes/${recipe.id}/edit`)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Edytuj
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      setIsDialogOpen(true);
                    }}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Usuń
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
              <Badge variant="outline" className="bg-secondary/50 text-xs">
                {mealTypeLabel}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {difficultyLabel}
              </Badge>
              {recipe.isAiGenerated ? (
                <Badge variant="default" className="bg-violet-500/90 text-white">
                  AI
                </Badge>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Ostatnia aktualizacja: {updatedLabel}</p>
          </CardContent>
          <CardFooter className="justify-between text-xs text-muted-foreground">
            <span>ID: {recipe.id}</span>
            <span>Utworzono: {formatRelative(new Date(recipe.createdAt), new Date(), { locale: pl })}</span>
          </CardFooter>
        </a>
      </Card>

      <RecipeDeleteDialog
        recipeName={recipe.name}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={() => onDelete(recipe.id)}
      />
    </>
  );
}
