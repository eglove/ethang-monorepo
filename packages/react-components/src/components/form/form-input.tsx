import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
type FormInputProperties<T extends FieldValues,> = {
  description?: string;
  fieldName: Path<T>;
  form: UseFormReturn<T>;
  label: string;
  placeholder?: string;
};

import {
  FormControl, FormDescription,
  FormField,
  FormItem,
  FormLabel, FormMessage,
} from "../ui/form.tsx";
import { Input } from "../ui/input.tsx";

export const FormInput = <T extends FieldValues,>({
  description,
  fieldName,
  form,
  label,
  placeholder,
}: Readonly<FormInputProperties<T>>) => {
  return (
    <FormField
      render={
        ({ field }) => {
          return (
            <FormItem>
              <FormLabel>
                {label}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={placeholder}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {description}
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }
      }
      control={form.control}
      name={fieldName}
    />
  );
};
