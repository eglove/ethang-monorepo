type CodeProperties = {
  children: string;
  language: string;
};

export const Code = async (properties: CodeProperties) => {
  return (
    <pre class="my-4" data-script="components/code">
      <code class={`language-${properties.language}`}>
        {properties.children}
      </code>
    </pre>
  );
};
