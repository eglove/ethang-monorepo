type CodeProperties = {
  children: string;
  language: string;
};

export const Code = async (properties: CodeProperties) => {
  return (
    <pre class="my-4">
      <code class={`language-${properties.language}`}>
        {properties.children}
      </code>
    </pre>
  );
};
