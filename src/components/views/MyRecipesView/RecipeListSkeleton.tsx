import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComponentPropsWithoutRef } from "react";

interface RecipeListSkeletonProps extends ComponentPropsWithoutRef<"div"> {
  itemCount?: number;
}

export function RecipeListSkeleton({ itemCount = 8, className, ...props }: RecipeListSkeletonProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)} {...props}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <Card key={index} className="border-border/60">
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
          <CardFooter className="justify-between">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/3" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
