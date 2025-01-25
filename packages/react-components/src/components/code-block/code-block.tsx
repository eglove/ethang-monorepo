import SyntaxHighlighter from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/hljs";

type CodeProperties = {
  children: string;
  className?: string;
  language?: string;
};

export const CodeBlock = ({
  children,
  className,
  language = "typescript",
}: Readonly<CodeProperties>) => {
  return (
    <div className={className}>
      <SyntaxHighlighter language={language} style={nightOwl}>
        {children}
      </SyntaxHighlighter>
    </div>
  );
};
