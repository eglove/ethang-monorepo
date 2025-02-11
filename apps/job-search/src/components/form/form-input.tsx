import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import { Input, type InputProperties } from "@/components/ui/input.tsx";

type FormInputProperties<T extends FieldValues> = Readonly<
  {
    description?: string;
    form: UseFormReturn<T>;
    label: string;
    name: Path<T>;
  } & Omit<InputProperties, "form">
>;

export const FormInput = <T extends FieldValues>({
  description,
  form,
  label,
  name,
  ...inputProperties
}: FormInputProperties<T>) => {
  return (
    <FormField
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input {...field} {...inputProperties} />
            </FormControl>
            <FormDescription>{description}</FormDescription>
            <FormMessage />
          </FormItem>
        );
      }}
      control={form.control}
      name={name}
    />
  );
};
