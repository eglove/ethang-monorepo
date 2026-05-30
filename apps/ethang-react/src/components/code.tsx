import SyntaxHighlighter from "react-syntax-highlighter";
// @ts-expect-error no types
import nightOwl from "react-syntax-highlighter/dist/esm/styles/hljs/night-owl.js";

type CodeProperties = {
  children: string;
  language: string;
};

export const Code = ({ children, language }: Readonly<CodeProperties>) => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    <SyntaxHighlighter PreTag="div" style={nightOwl} language={language}>
      {children}
    </SyntaxHighlighter>
  );
};
