import { RuleTester } from "eslint";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";

import { noBarrelFileRule } from "./no-barrel-file.ts";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: { jsx: true },
      ecmaVersion: 2024,
      sourceType: "module"
    }
  }
});

const HELPER_REEXPORT = 'export { helper } from "./helper.js";';

const temporary = (filename: string): string => {
  return path.join(process.cwd(), "src", filename);
};

ruleTester.run("no-barrel-file", noBarrelFileRule as never, {
  invalid: [
    {
      code: 'export { foo } from "./foo.js";\nexport { bar } from "./bar.js";',
      errors: [{ messageId: "noBarrelFile" }],
      filename: temporary("index.ts")
    },
    {
      code: 'export * from "./everything.js";',
      errors: [{ messageId: "noBarrelFile" }],
      filename: temporary("index.ts")
    },
    {
      code: HELPER_REEXPORT,
      errors: [{ messageId: "noDeepBarrelFile" }],
      filename: path.join(process.cwd(), "src", "nested", "deep", "index.ts")
    },
    {
      code: HELPER_REEXPORT,
      errors: [{ messageId: "noDeepBarrelFile" }],
      filename: path.join(process.cwd(), "packages", "foo", "index.ts")
    },
    {
      code: HELPER_REEXPORT,
      errors: [{ messageId: "noBarrelFile" }],
      filename: path.join(process.cwd(), "src", "index.ts")
    },
    {
      code: HELPER_REEXPORT,
      errors: [{ messageId: "noDeepBarrelFile" }],
      filename: path.join(
        process.cwd(),
        "packages",
        "eslint-plugin",
        "index.ts"
      )
    },
    {
      code: 'export { foo } from "./foo.js";',
      errors: [{ messageId: "noBarrelFile" }],
      filename: "index.ts"
    }
  ],
  valid: [
    {
      code: "export const foo = 1;\nexport const bar = 2;",
      filename: temporary("regular.ts")
    },
    {
      code: 'export const foo = 1;\nexport { bar } from "./bar.js";',
      filename: temporary("mixed.ts")
    },
    {
      code: 'export { default } from "./default.js";',
      filename: temporary("default-export.ts")
    },
    {
      code: "",
      filename: temporary("index.ts")
    },
    {
      code: 'export { foo } from "./foo.js";',
      filename: path.join(
        process.cwd(),
        "node_modules",
        "some-package",
        "src",
        "index.ts"
      )
    },
    {
      code: "export default function foo() {}",
      filename: temporary("index.ts")
    },
    {
      code: "export const foo = 1;",
      filename: temporary("index.ts")
    },
    {
      code: 'export { foo } from "./foo.js";\nexport default {};',
      filename: temporary("index.ts")
    }
  ]
});
