import type { ReferenceProperties } from "@/types/reference.ts";
import type { Root as LabelPrimitive } from "@radix-ui/react-label";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import isNil from "lodash/isNil.js";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  createContext,
  type RefObject,
  use,
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
  const fieldContext = use(FormFieldContext);
  const itemContext = use(FormItemContext);
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
  ref,
  ...properties
}: ReferenceProperties<HTMLDivElement>) => {
  const id = useId();

  return (
    <FormItemContext value={{ id }}>
      <div className={cn("space-y-2", className)} ref={ref} {...properties} />
    </FormItemContext>
  );
};
FormItem.displayName = "FormItem";

type FormLabelProperties = Readonly<
  {
    ref?: RefObject<ComponentRef<typeof LabelPrimitive> | null>;
  } & ComponentPropsWithoutRef<typeof LabelPrimitive>
>;

const FormLabel = ({ className, ref, ...properties }: FormLabelProperties) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      ref={ref}
      {...properties}
    />
  );
};
FormLabel.displayName = "FormLabel";

type FormControlProperties = Readonly<
  {
    ref?: RefObject<ComponentRef<typeof Slot> | null>;
  } & ComponentPropsWithoutRef<typeof Slot>
>;

const FormControl = ({ ref, ...properties }: FormControlProperties) => {
  const { error, formDescriptionId, formItemId, formMessageId } =
    useFormField();

  return (
    <Slot
      aria-describedby={
        error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
      }
      aria-invalid={Boolean(error)}
      id={formItemId}
      ref={ref}
      {...properties}
    />
  );
};
FormControl.displayName = "FormControl";

const FormDescription = ({
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLParagraphElement>) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      id={formDescriptionId}
      ref={ref}
      {...properties}
    />
  );
};
FormDescription.displayName = "FormDescription";

const FormMessage = ({
  children,
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLParagraphElement>) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message) : children;

  if (isNil(body)) {
    return null;
  }

  return (
    <p
      className={cn("text-sm font-medium text-destructive", className)}
      id={formMessageId}
      ref={ref}
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
