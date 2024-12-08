import {
  headingsPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorProps,
  quotePlugin,
  thematicBreakPlugin,
} from "@mdxeditor/editor";

type MdxEditorProperties = MDXEditorProps;

export const MdxEditor = ({
  ...properties
}: Readonly<MdxEditorProperties>) => {
  return (
    <MDXEditor
      plugins={
        [
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
        ]
      }
      {...properties}
    />
  );
};
