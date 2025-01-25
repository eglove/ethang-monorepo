import "reactjs-tiptap-editor/style.css";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import RichTextEditor, {
  BaseKit,
  Blockquote,
  Bold,
  BulletList,
  Clear,
  Code,
  CodeBlock,
  Color,
  Emoji,
  Heading,
  Highlight,
  History,
  Image,
  Italic,
  Katex,
  Link,
  Mermaid,
  OrderedList,
  Strike,
  Table,
  Underline,
} from "reactjs-tiptap-editor";

import { FormControl, FormField, FormItem, FormLabel } from "../ui/form.tsx";

const extensions = [
  BaseKit.configure({
    placeholder: {
      showOnlyCurrent: true,
    },
  }),
  Heading,
  Link.configure({
    HTMLAttributes: { "aria-label": "link" },
  }),
  Bold,
  Italic,
  Strike,
  Underline,
  BulletList,
  OrderedList,
  Blockquote,
  Highlight,
  Code,
  CodeBlock,
  Color,
  Image,
  Table,
  Emoji,
  Katex,
  Mermaid,
  History,
  Clear,
];

type FormRichTextProperties<T extends FieldValues> = {
  fieldName: Path<T>;
  form: UseFormReturn<T>;
  label: string;
};

export const FormRichText = <T extends FieldValues>({
  fieldName,
  form,
  label,
}: Readonly<FormRichTextProperties<T>>) => {
  return (
    <FormField
      render={({ field }) => {
        return (
          <FormItem className="max-w-prose">
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <RichTextEditor
                content={field.value}
                extensions={extensions}
                onChangeContent={field.onChange}
                output="json"
              />
            </FormControl>
          </FormItem>
        );
      }}
      control={form.control}
      name={fieldName}
    />
  );
};
