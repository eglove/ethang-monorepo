import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectRule } from "./prefer-effect.ts";

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

ruleTester.run("prefer-effect", preferEffectRule as never, {
  invalid: [
    {
      code: "[1, 2, 3].map((x) => x * 2);",
      errors: [{ messageId: "preferEffect" }],
      output:
        'Array.map([1, 2, 3], (x) => x * 2);\nimport { Array } from "effect";'
    },
    {
      code: "const xs = [1, 2, 3]; xs.filter((x) => x > 1);",
      errors: [{ messageId: "preferEffect" }],
      output:
        'const xs = [1, 2, 3]; Array.filter(xs, (x) => x > 1);\nimport { Array } from "effect";'
    },
    {
      code: "const xs = [1, 2, 3]; xs.flatMap((x) => [x, x + 1]);",
      errors: [{ messageId: "preferEffect" }],
      output:
        'const xs = [1, 2, 3]; Array.flatMap(xs, (x) => [x, x + 1]);\nimport { Array } from "effect";'
    },
    {
      code: "const xs = [1, 2, 3]; xs.some((x) => x > 1);",
      errors: [{ messageId: "preferEffect" }],
      output:
        'const xs = [1, 2, 3]; Array.some(xs, (x) => x > 1);\nimport { Array } from "effect";'
    },
    {
      code: "const xs = [1, 2, 3]; xs.find((x) => x > 1);",
      errors: [{ messageId: "preferEffect" }],
      output:
        'const xs = [1, 2, 3]; Array.find(xs, (x) => x > 1);\nimport { Array } from "effect";'
    },
    {
      code: "const xs = [1, 2, 3]; xs.includes(2);",
      errors: [{ messageId: "preferEffect" }],
      output:
        'const xs = [1, 2, 3]; Array.includes(xs, 2);\nimport { Array } from "effect";'
    },
    {
      code: 'import { Array } from "effect";\nconst xs = [1, 2, 3]; xs.map((x) => x);',
      errors: [{ messageId: "preferEffect" }],
      output:
        'import { Array } from "effect";\nconst xs = [1, 2, 3]; Array.map(xs, (x) => x);'
    },
    {
      code: "[1, 2, 3].forEach((x) => console.log(x));",
      errors: [{ messageId: "preferEffect" }],
      output:
        'Array.forEach([1, 2, 3], (x) => console.log(x));\nimport { Array } from "effect";'
    },
    {
      code: "const xs = [1, 2, 3]; xs.isEmptyArray();",
      errors: [{ messageId: "preferEffect" }],
      output:
        'const xs = [1, 2, 3]; Array.isEmptyArray(xs);\nimport { Array } from "effect";'
    }
  ],
  valid: [
    {
      code: "Array.map([1, 2, 3], (x) => x * 2);"
    },
    {
      code: "const m = new Map(); m.set('a', 1);"
    },
    {
      code: "const s = new Set([1, 2, 3]); s.has(1);"
    },
    {
      code: "Promise.resolve(1).then((x) => x + 1);"
    },
    {
      code: 'import { Array } from "effect"; Array.map([1, 2, 3], (x) => x);'
    },
    {
      code: "const xs = [1, 2, 3]; xs.keyBy((x) => x);"
    },
    {
      code: 'import { DateTime } from "effect"; const d = DateTime.make("2024-01-01");'
    },
    {
      code: "const res = new Response(); res.clone();"
    },
    {
      code: 'import { Schema } from "effect"; Schema.filter("x", (s) => s.length > 0);'
    },
    {
      code: 'import { Stream } from "effect"; Stream.filter(stream, (x) => x > 0);'
    },
    {
      code: 'import { Schema } from "effect"; import { foo } from "other"; Schema.filter("x", (s) => s.length > 0);'
    }
  ]
});
