import { getLocalTimeZone, parseAbsolute } from "@internationalized/date";
import { headingsPlugin, MDXEditor } from "@mdxeditor/editor";
import { Button } from "@nextui-org/button";
import { DateRangePicker } from "@nextui-org/date-picker";
import { Input } from "@nextui-org/input";
import { useForm } from "@tanstack/react-form";
import { createLazyFileRoute } from "@tanstack/react-router";
import "@mdxeditor/editor/style.css";
import isError from "lodash/isError.js";

import { DefaultEditor } from "../../../components/default-editor.tsx";

const Create = () => {
  const absolute = parseAbsolute(new Date().toISOString(), getLocalTimeZone());

  const form = useForm({
    defaultValues: {
      dates: {
        end: absolute,
        start: absolute,
      },
      description: "",
      title: "",
      type: "event",
    },

  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit().catch((error: unknown) => {
          if (isError(error)) {
            console.error(error);
          }
        });
      }}
      className="grid max-w-md gap-4"
    >
      <form.Field
        children={(fieldApi) => {
          return (
            <Input
              errorMessage={fieldApi.state.meta.errors[0]}
              id={fieldApi.name}
              label="Title"
              name={fieldApi.name}
              onBlur={fieldApi.handleBlur}
              onValueChange={fieldApi.handleChange}
              value={fieldApi.state.value}
            />
          );
        }}
        name="title"
      />
      <form.Field
        children={(fieldApi) => {
          return (
            <DateRangePicker
              id={fieldApi.name}
              label="Dates"
              onBlur={fieldApi.handleBlur}
              onChange={fieldApi.handleChange}
              value={fieldApi.state.value}
              visibleMonths={2}
            />
          );
        }}
        name="dates"
      />
      <MDXEditor
        markdown="# Hello World"
        plugins={[headingsPlugin()]}
      />
      <form.Field
        children={(fieldApi) => {
          return (
            <DefaultEditor
              onChange={(event) => {
                fieldApi.handleChange(event.target.value);
              }}
              id={fieldApi.name}
              name={fieldApi.name}
              onBlur={fieldApi.handleBlur}
              value={fieldApi.state.value}
            />

          );
        }}
        name="description"
      />
      <form.Subscribe children={(state) => {
        return (
          <Button
            disabled={!state.canSubmit}
            type="submit"
          >
            Create
          </Button>
        );
      }}
      />
    </form>
  );
};

export const Route = createLazyFileRoute("/admin/event/create")({
  component: Create,
});
