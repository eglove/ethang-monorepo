import type { Root } from "@radix-ui/react-label";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import isNil from "lodash/isNil";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  useContext,
  useId,
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
    <FormFieldContext value={{ name: properties.name }}>
      <Controller {...properties} />
    </FormFieldContext>
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

const FormItem = ({
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLDivElement>>) => {
  const id = useId();

  return (
    <FormItemContext value={{ id }}>
      <div className={cn("space-y-2", className)} {...properties} />
    </FormItemContext>
  );
};
FormItem.displayName = "FormItem";

const FormLabel = ({
  className,
  ...properties
}: Readonly<ComponentProps<typeof Root>>) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      className={cn(error && "text-red-600 dark:text-red-500", className)}
      htmlFor={formItemId}
      {...properties}
    />
  );
};
FormLabel.displayName = "FormLabel";

const FormControl = ({
  ...properties
}: Readonly<ComponentProps<typeof Slot>>) => {
  const { error, formDescriptionId, formItemId, formMessageId } =
    useFormField();

  return (
    <Slot
      aria-describedby={
        error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
      }
      aria-invalid={Boolean(error)}
      id={formItemId}
      {...properties}
    />
  );
};
FormControl.displayName = "FormControl";

const FormDescription = ({
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLParagraphElement>>) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      className={cn(
        "text-[0.8rem] text-neutral-500 dark:text-neutral-400",
        className,
      )}
      id={formDescriptionId}
      {...properties}
    />
  );
};
FormDescription.displayName = "FormDescription";

const FormMessage = ({
  children,
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLParagraphElement>>) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message) : children;

  if (isNil(body)) {
    return null;
  }

  return (
    <p
      className={cn(
        "text-[0.8rem] font-medium text-red-600 dark:text-red-500",
        className,
      )}
      id={formMessageId}
      {...properties}
    >
      {body}
    </p>
  );
};
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
