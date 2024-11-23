import {
  BtnBold, BtnBulletList, BtnClearFormatting,
  BtnItalic, BtnLink, BtnNumberedList,
  BtnRedo, BtnStrikeThrough, BtnStyles,
  BtnUnderline,
  BtnUndo,
  Editor, type EditorProps,
  EditorProvider,
  Separator,
  Toolbar,
} from "react-simple-wysiwyg";

export const DefaultEditor = (
  properties: Readonly<EditorProps>,
) => {
  return (
    <EditorProvider>
      <Editor
        {...properties}
      >
        <Toolbar>
          <BtnUndo />
          <BtnRedo />
          <Separator />
          <BtnBold />
          <BtnItalic />
          <BtnUnderline />
          <BtnStrikeThrough />
          <Separator />
          <BtnNumberedList />
          <BtnBulletList />
          <Separator />
          <BtnLink />
          <BtnClearFormatting />
          <Separator />
          <BtnStyles />
        </Toolbar>
      </Editor>
    </EditorProvider>
  );
};
