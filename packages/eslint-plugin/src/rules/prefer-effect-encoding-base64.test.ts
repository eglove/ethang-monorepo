import { RuleTester } from "eslint";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectEncodingBase64Rule } from "./prefer-effect-encoding-base64.ts";

const BASE64 = "base64";
const ENCODE_OUTPUT = "const x = Encoding.encodeBase64(s);";
const DECODE_OUTPUT = "const x = Encoding.decodeBase64(s);";

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

ruleTester.run(
  "prefer-effect-encoding-base64",
  preferEffectEncodingBase64Rule as never,
  {
    invalid: [
      {
        code: `const x = Buffer.from(s).toString("${BASE64}");`,
        errors: [{ messageId: "preferEffectEncodingBase64" }],
        output: ENCODE_OUTPUT
      },
      {
        code: `const x = Buffer.from(name + "!").toString("${BASE64}");`,
        errors: [{ messageId: "preferEffectEncodingBase64" }],
        output: 'const x = Encoding.encodeBase64(name + "!");'
      },
      {
        code: `const x = Buffer.from(s, "${BASE64}").toString();`,
        errors: [{ messageId: "preferEffectEncodingBase64" }],
        output: DECODE_OUTPUT
      },
      {
        code: `const x = Buffer.from(s, "${BASE64}").toString("utf8");`,
        errors: [{ messageId: "preferEffectEncodingBase64" }],
        output: DECODE_OUTPUT
      }
    ],
    valid: [
      { code: "const x = Encoding.encodeBase64(s);" },
      { code: "const x = Encoding.decodeBase64(s);" },
      { code: 'const x = Buffer.from(s).toString("hex");' },
      { code: "const x = Buffer.from(s).toString();" },
      { code: 'const x = Buffer.from(s, "utf8").toString();' },
      { code: `const x = Buffer.from(s, "${BASE64}").toString("hex");` },
      { code: `const x = foo.toString("${BASE64}");` },
      { code: `const x = new Buffer(s).toString("${BASE64}");` },
      { code: "const x = btoa(s);" }
    ]
  }
);
