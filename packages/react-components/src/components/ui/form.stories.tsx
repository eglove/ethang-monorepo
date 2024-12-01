import {
  Form,
  FormControl, FormDescription,
  FormField,
  FormItem,
  FormLabel, FormMessage,
} from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useForm } from "react-hook-form";

export default {
  title: "ui/form",
};

export const Default = () => {
  const form = useForm({
    defaultValues: {
      name: "",
    },
  });

  form.setError("name", { message: "Error message" });

  return (
    <Form {...form}>
      <FormField
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>
                Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your name"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                It's your name
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
        control={form.control}
        name="name"
      />
    </Form>
  );
};
