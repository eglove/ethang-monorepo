// @ts-expect-error css
import "reactjs-tiptap-editor/style.css";
import { useAuth } from "@clerk/clerk-react";
import { FormInput } from "@ethang/react-components/src/components/form/form-input.tsx";
import { Button } from "@ethang/react-components/src/components/ui/button.tsx";
import { Form } from "@ethang/react-components/src/components/ui/form.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Navigate, useNavigate } from "@tanstack/react-router";
import { useMutation as useConvexMutation } from "convex/react";
import isError from "lodash/isError";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { api } from "../../../convex/_generated/api";

const upsertCourseFormSchema = z.object({
  name: z.string().min(1, "Required"),
  url: z.string().url(),
});

export const UpsertCourseForm = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      name: "",
      url: "",
    },
    resolver: zodResolver(upsertCourseFormSchema),
  });

  const { mutate } = useMutation({
    mutationFn: useConvexMutation(api.courses.createCourse),
    onError: () => {
      toast.error("Failed to create course", {
        id: "create-course-error",
      });
    },
    onSuccess: () => {
      navigate({ to: "/" }).catch((error: unknown) => {
        if (isError(error)) {
          console.error(error);
        }
      });
    },
  });

  const handleSubmit = (data: z.output<typeof upsertCourseFormSchema>) => {
    mutate(data);
  };

  if (false === isSignedIn) {
    return <Navigate to="/" />;
  }

  return (
    <Form {...form}>
      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises,sonar/no-misused-promises */}
      <form onSubmit={form.handleSubmit(handleSubmit)}>
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

