// @ts-expect-error css
import "reactjs-tiptap-editor/style.css";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form.tsx";
import RichTextEditor, {
  BaseKit, Blockquote,
  Bold, BulletList, Clear, Code, CodeBlock, Color, Emoji,
  Heading, Highlight, History, Image, Italic, Katex,
  Link, Mermaid, OrderedList, Strike, Table, Underline,
} from "reactjs-tiptap-editor";

const extensions = [
  BaseKit.configure({
    placeholder: {
      showOnlyCurrent: true,
    },
  }),
  Heading,
  Link,
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

type EditorProperties<T extends FieldValues,> = {
  fieldName: Path<T>;
  form: UseFormReturn<T>;
  label: string;
};

export const Editor = <T extends FieldValues,>({
  fieldName,
  form,
  label,
}: Readonly<EditorProperties<T>>) => {
  return (
    <FormField
      render={({ field }) => {
        return (
          <FormItem className="max-w-prose">
            <FormLabel>
              {label}
            </FormLabel>
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

