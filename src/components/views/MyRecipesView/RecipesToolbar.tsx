import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

type RecipesToolbarProps = ComponentPropsWithoutRef<"div">;

export function RecipesToolbar({ className, ...props }: RecipesToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-background/60 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground">Twoje przepisy</h2>
        <p className="text-sm text-muted-foreground">
          Zarządzaj kolekcją ulubionych potraw, filtruj wyniki i twórz nowe inspiracje.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="sm:w-auto">
          <a href="/recipes/new" className="flex items-center gap-2">
            <Plus className="size-4" aria-hidden="true" />
            Dodaj nowy przepis
          </a>
        </Button>
        <Button variant="outline" asChild className="sm:w-auto">
          <a href="/recipes/generate" className="flex items-center gap-2">
            <Sparkles className="size-4" aria-hidden="true" />
            Generuj przepis z AI
          </a>
        </Button>
      </div>
    </div>
  );
}
