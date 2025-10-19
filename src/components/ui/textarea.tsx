import * as React from "react";

import { cn } from "@/lib/utils";

const textareaStyles =
  "min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} className={cn(textareaStyles, className)} {...props} />;
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
