import { describe, expect, it } from "vitest";

import { Code } from "./code.tsx";

const CODE_CONTENT = "const x = 1;";

describe(Code, () => {
  it("renders pre and code elements with the language class", async () => {
    const html = String(await Code({ children: CODE_CONTENT, language: "ts" }));

    expect(html).toContain("<pre");
    expect(html).toContain('<code class="language-ts"');
    expect(html).toContain(CODE_CONTENT);
  });
});
