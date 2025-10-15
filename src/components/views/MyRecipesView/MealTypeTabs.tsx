import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { RecipeRow } from "@/db/database.types";

const MEAL_TYPE_LABELS: Record<RecipeRow["meal_type"], string> = {
  breakfast: "Śniadanie",
  lunch: "Lunch",
  dinner: "Obiad",
  dessert: "Deser",
  snack: "Przekąska",
};

interface MealTypeTabsProps {
  currentValue: RecipeRow["meal_type"] | "all";
  onValueChange: (value: RecipeRow["meal_type"] | "all") => void;
  className?: string;
}

export function MealTypeTabs({ currentValue, onValueChange, className }: MealTypeTabsProps) {
  return (
    <Tabs
      value={currentValue}
      onValueChange={(value) => onValueChange(value as MealTypeTabsProps["currentValue"])}
      className={cn("w-full", className)}
    >
      <TabsList className="grid grid-cols-2 gap-2 bg-transparent p-0 sm:flex sm:flex-wrap sm:justify-start">
        <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Wszystkie
        </TabsTrigger>
        {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
          <TabsTrigger
            key={value}
            value={value}
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
