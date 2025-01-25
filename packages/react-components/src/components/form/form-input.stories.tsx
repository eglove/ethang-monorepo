import { FormInput } from "@/components/form/form-input.tsx";
import { Form } from "@/components/ui/form.tsx";
import { useForm } from "react-hook-form";

export default {
  title: "form/form-input",
};

export const Default = () => {
  const form = useForm({
    defaultValues: { name: "" },
  });

  return (
    <Form {...form}>
      <FormInput fieldName="name" form={form} label="Name" />
    </Form>
  );
};
