import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingAlertProps {
  show: boolean;
  onDismiss: () => Promise<void>;
  className?: string;
}

export function OnboardingAlert({ show, onDismiss, className }: OnboardingAlertProps) {
  const [isPending, setIsPending] = useState(false);

  if (!show) {
    return null;
  }

  const handleDismiss = async () => {
    if (isPending) {
      return;
    }

    try {
      setIsPending(true);
      await onDismiss();
    } catch (error) {
      console.error("Failed to dismiss onboarding alert", { error });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Alert
      className={cn(
        "rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground shadow-sm",
        className
      )}
    >
      <AlertTriangle className="size-5 text-primary" aria-hidden="true" />
      <div className="flex-1 space-y-2">
        <AlertTitle className="font-semibold text-foreground">Uzupełnij swoje preferencje żywieniowe</AlertTitle>
        <AlertDescription className="text-sm leading-relaxed text-muted-foreground">
          Dzięki temu będziemy mogli lepiej dopasować przepisy do Twoich potrzeb i zasugerować idealne propozycje na
          każdy dzień.
        </AlertDescription>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild size="sm" className="sm:w-auto">
            <a href="/preferences">Uzupełnij profil</a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="sm:w-auto"
            onClick={handleDismiss}
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Przetwarzanie...
              </span>
            ) : (
              "Przypomnij później"
            )}
          </Button>
        </div>
      </div>
    </Alert>
  );
}
