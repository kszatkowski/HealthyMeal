import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Database } from "@/db/database.types";

type MealType = Database["public"]["Enums"]["meal_type"];

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Śniadanie",
  lunch: "Lunch",
  dinner: "Obiad",
  dessert: "Deser",
  snack: "Przekąska",
};

interface MealTypeTabsProps {
  currentValue: MealType | "all";
  onValueChange: (value: MealType | "all") => void;
  className?: string;
}

export function MealTypeTabs({ currentValue, onValueChange, className }: MealTypeTabsProps) {
  return (
    <Tabs
      value={currentValue}
      onValueChange={(value) => onValueChange(value as MealTypeTabsProps["currentValue"])}
      className={cn("w-full h-full", className)}
    >
      <TabsList className="grid grid-cols-2 gap-2 bg-transparent p-0 sm:flex sm:flex-wrap sm:justify-start h-full">
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
