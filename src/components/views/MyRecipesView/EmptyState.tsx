import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

interface EmptyStateProps extends ComponentPropsWithoutRef<"div"> {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center",
        className
      )}
      {...props}
    >
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">{description}</p>
      </div>
      {actionLabel ? (
        <Button asChild={Boolean(actionHref)} variant="outline" onClick={actionHref ? undefined : onAction}>
          {actionHref ? <a href={actionHref}>{actionLabel}</a> : actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
