// @ts-expect-error css
import "reactjs-tiptap-editor/style.css";
import { FormInput } from "@/components/form/form-input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Form } from "@/components/ui/form.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const upsertCourseFormSchema = z.object({
  name: z.string().min(1, "Required"),
  url: z.string().url(),
});

export const UpsertCourseForm = () => {
  const { isAuthenticated } = useConvexAuth();
  const form = useForm({
    defaultValues: {
      name: "",
      url: "",
    },
    resolver: zodResolver(upsertCourseFormSchema),
  });

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {
        console.log("hey");
      })}
      >
        <FormInput
          fieldName="name"
          form={form}
          label="Name"
        />
        <FormInput
          fieldName="url"
          form={form}
          label="URL"
        />
        <Button
          className="my-2"
          type="submit"
        >
          Submit
        </Button>
      </form>
    </Form>
  );
};

