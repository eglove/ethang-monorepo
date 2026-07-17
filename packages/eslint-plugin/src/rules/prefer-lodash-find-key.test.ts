import { RuleTester } from "eslint";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";

import { preferLodashFindKeyRule } from "./prefer-lodash-find-key.ts";

const pluginDirectory = import.meta.dirname;

const fixturesRoot = path.join(
  pluginDirectory,
  ".fixtures",
  "prefer-lodash-find-key"
);
const fixture = (name: string) => {
  return {
    code: "",
    filename: path.join(fixturesRoot, `${name}.fixture.ts`)
  };
};

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

ruleTester.run("prefer-lodash-find-key", preferLodashFindKeyRule as never, {
  invalid: [
    // -------- basic rewrite --------
    {
      code: "Object.keys(o).find((k) => o[k] > 0);",
      errors: [{ messageId: "preferLodashFindKey" }],
      output: "findKey(o, (v) => v > 0);"
    },

    // -------- multiple `o[k]` accesses in the body --------
    {
      code: "Object.keys(record).find((k) => record[k] && record[k].length > 0);",
      errors: [{ messageId: "preferLodashFindKey" }],
      output: "findKey(record, (v) => v && v.length > 0);"
    },

    // -------- param name preserved through the rewrite (renamed to v) --------
    {
      code: "Object.keys(obj).find((key) => obj[key] !== null);",
      errors: [{ messageId: "preferLodashFindKey" }],
      output: "findKey(obj, (v) => v !== null);"
    },

    // -------- already-lodash with the same name: still flagged because
    //          the receiver is `Object.keys`, not `keys`. --------
    {
      code: "Object.keys(data).find((k) => data[k] > 0);",
      errors: [{ messageId: "preferLodashFindKey" }],
      output: "findKey(data, (v) => v > 0);"
    },

    // -------- member expression on `o[k]` (computed access as object) --------
    {
      code: "Object.keys(o).find((k) => o[k].active);",
      errors: [{ messageId: "preferLodashFindKey" }],
      output: "findKey(o, (v) => v.active);"
    },

    // -------- nested: `o[k]` reused twice in the same expression --------
    {
      code: "Object.keys(o).find((k) => o[k] === o[k]);",
      errors: [{ messageId: "preferLodashFindKey" }],
      output: "findKey(o, (v) => v === v);"
    }
  ],
  valid: [
    // -------- receiver isn't `Object.keys` --------
    { code: "Object.values(o).find((k) => o[k] > 0);" },
    { code: "Object.entries(o).find(([, v]) => v > 0);" },
    { code: "Reflect.ownKeys(o).find((k) => o[k] > 0);" },
    { code: "keys(o).find((k) => o[k] > 0);" },

    // -------- inner receiver isn't a single identifier --------
    {
      code: "Object.keys(getObj()).find((k) => o[k] > 0);"
    },

    // -------- arrow takes no param --------
    { code: "Object.keys(o).find(() => o.something > 0);" },

    // -------- arrow has more than one param --------
    {
      code: "Object.keys(o).find((k, idx) => o[k] > 0);"
    },

    // -------- destructured param (would make rewrite ambiguous) --------
    {
      code: "Object.keys(o).find(([, v]) => v > 0);"
    },

    // -------- block body (out of scope for the MVP) --------
    {
      code: "Object.keys(o).find((k) => { return o[k] > 0; });"
    },

    // -------- function expression (only arrows detected) --------
    {
      code: "Object.keys(o).find(function (k) { return o[k] > 0; });"
    },

    // -------- body uses param outside `o[k]` (semantic mismatch) --------
    { code: "Object.keys(o).find((k) => k.startsWith('a'));" },
    {
      code: "Object.keys(o).find((k) => o[k] && k.length > 0);"
    },

    // -------- already lodash ---------
    { code: "findKey(o, (v) => v > 0);" },

    // -------- empty body access list --------
    { code: "Object.keys(o).find((k) => o.something);" },

    // -------- eslint-disable directive (anchored to a real fixture file
    //          so ESLint's directive scanner has a path). --------
    {
      ...fixture("valid-eslint-disable"),
      code: "// eslint-disable-next-line rule-to-test/prefer-lodash-find-key\nObject.keys(object).find((k) => object[k] > 0);"
    }
  ]
});
