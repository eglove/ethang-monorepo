type CodeProperties = {
  children: string;
  language: string;
};

export const Code = async (properties: CodeProperties) => {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/night-owl.min.css"
      />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"></script>
      <script>hljs.highlightAll();</script>
      <pre class="my-4">
        <code class={`language-${properties.language}`}>
          {properties.children}
        </code>
      </pre>
    </>
  );
};
