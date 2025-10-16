import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const Form = FormProvider;

interface FormFieldContextValue {
  name: string;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { formState } = useFormContext();

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const fieldState = formState.errors[fieldContext.name];

  return {
    id: itemContext?.id,
    controlId: itemContext?.controlId,
    descriptionId: itemContext?.descriptionId,
    messageId: itemContext?.messageId,
    name: fieldContext.name,
    fieldState,
  };
}

function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  name,
  ...props
}: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name }}>
      <Controller name={name} {...props} />
    </FormFieldContext.Provider>
  );
}

interface FormItemContextValue {
  id: string;
  controlId: string;
  descriptionId: string;
  messageId: string;
}

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

const FormItem = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {
  const id = React.useId();
  const contextValue = React.useMemo(
    () => ({
      id,
      controlId: `${id}-control`,
      descriptionId: `${id}-description`,
      messageId: `${id}-message`,
    }),
    [id]
  );

  return (
    <FormItemContext.Provider value={contextValue}>
      <div ref={ref} className={cn("grid gap-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});

FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<React.ElementRef<typeof Label>, React.ComponentPropsWithoutRef<typeof Label>>(
  ({ className, ...props }, ref) => {
    const { controlId } = useFormField();
    return <Label ref={ref} className={cn(className)} htmlFor={controlId} {...props} />;
  }
);

FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  (props, ref) => {
    const { controlId, descriptionId, messageId } = useFormField();
    const describedBy = [descriptionId, messageId].filter(Boolean).join(" ");

    return <Slot ref={ref} id={controlId} aria-describedby={describedBy || undefined} {...props} />;
  }
);

FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(
  ({ className, ...props }, ref) => {
    const { descriptionId } = useFormField();

    return <p ref={ref} id={descriptionId} className={cn("text-muted-foreground text-sm", className)} {...props} />;
  }
);

FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<HTMLParagraphElement, React.ComponentProps<"p">>(
  ({ className, children, ...props }, ref) => {
    const { fieldState, messageId } = useFormField();
    const fieldError = fieldState as { message?: React.ReactNode } | undefined;
    const body = (fieldError?.message ?? children) as React.ReactNode;

    if (!body) {
      return null;
    }

    return (
      <p
        ref={ref}
        id={messageId}
        className={cn("text-destructive text-sm font-medium", className)}
        role="alert"
        {...props}
      >
        {body}
      </p>
    );
  }
);

FormMessage.displayName = "FormMessage";

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage };
