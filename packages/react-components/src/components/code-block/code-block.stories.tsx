import { CodeBlock } from "@/components/code-block/code-block.tsx";

export default {
  title: "code-block",
};

const code = String.raw`const printMessage = () => {
    console.log('Hello, World!');
}`;

export const Default = () => {
  return <CodeBlock>{code}</CodeBlock>;
};
