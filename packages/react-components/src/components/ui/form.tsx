import type { Root } from "@radix-ui/react-label";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import isNil from "lodash/isNil";
import {
  type ComponentPropsWithoutRef,
  createContext,
  type ElementRef,
  forwardRef, type HTMLAttributes, useContext, useId,
} from "react";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";

import { Label } from "./label";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = createContext<FormFieldContextValue>(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...properties
}: Readonly<ControllerProps<TFieldValues, TName>>) => {
  return (
  // eslint-disable-next-line react/no-unstable-context-value
    <FormFieldContext.Provider value={{ name: properties.name }}>
      <Controller {...properties} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { formState, getFieldState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (isNil(fieldContext)) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    formDescriptionId: `${id}-form-item-description`,
    formItemId: `${id}-form-item`,
    formMessageId: `${id}-form-item-message`,
    id,
    name: fieldContext.name,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = createContext<FormItemContextValue>(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  {} as FormItemContextValue,
);

const FormItem = forwardRef<
  HTMLDivElement,
  Readonly<HTMLAttributes<HTMLDivElement>>
>(({ className, ...properties }, reference) => {
  const id = useId();

  return (
  // eslint-disable-next-line react/no-unstable-context-value
    <FormItemContext.Provider value={{ id }}>
      <div
        className={cn("space-y-2", className)}
        ref={reference}
        {...properties}
      />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

const FormLabel = forwardRef<
  ElementRef<typeof Root>,
  Readonly<ComponentPropsWithoutRef<typeof Root>>
>(({ className, ...properties }, reference) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      className={cn(error && "text-red-600 dark:text-red-500", className)}
      htmlFor={formItemId}
      ref={reference}
      {...properties}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = forwardRef<
  ElementRef<typeof Slot>,
  Readonly<ComponentPropsWithoutRef<typeof Slot>>
>(({ ...properties }, reference) => {
  const {
    error,
    formDescriptionId,
    formItemId,
    formMessageId,
  } = useFormField();

  return (
    <Slot
      aria-describedby={
        error
          ? `${formDescriptionId} ${formMessageId}`
          : formDescriptionId
      }
      aria-invalid={Boolean(error)}
      id={formItemId}
      ref={reference}
      {...properties}
    />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = forwardRef<
  HTMLParagraphElement,
  Readonly<HTMLAttributes<HTMLParagraphElement>>
>(({ className, ...properties }, reference) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      className={cn("text-[0.8rem] text-neutral-500 dark:text-neutral-400", className)}
      id={formDescriptionId}
      ref={reference}
      {...properties}
    />
  );
});
FormDescription.displayName = "FormDescription";

const FormMessage = forwardRef<
  HTMLParagraphElement,
  Readonly<HTMLAttributes<HTMLParagraphElement>>
>(({ children, className, ...properties }, reference) => {
  const { error, formMessageId } = useFormField();
  const body = error
    ? String(error.message)
    : children;

  if (isNil(body)) {
    return null;
  }

  return (
    <p
      className={cn("text-[0.8rem] font-medium text-red-600 dark:text-red-500", className)}
      id={formMessageId}
      ref={reference}
      {...properties}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
};
