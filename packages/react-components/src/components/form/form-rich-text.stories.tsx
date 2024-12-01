import { FormRichText } from "@/components/form/form-rich-text.tsx";
import { Form } from "@/components/ui/form.tsx";
import { useForm } from "react-hook-form";

export default {
  parameters: {
    a11y: {
      disable: true,
    },
  },
  title: "form/form-rich-text",
};

export const Default = () => {
  const form = useForm({
    defaultValues: { description: "" },
  });

  return (
    <Form {...form}>
      <FormRichText
        fieldName="description"
        form={form}
        label="Description"
      />
    </Form>
  );
};
