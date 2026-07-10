import { RuleTester } from "eslint";

import { pathStyleRule } from "./path-style.ts";

const ruleTester = new RuleTester();

const AS_NEEDED = ["as-needed"];
const ARRAY = ["array"];
const STRING = ["string"];
const LODASH_GET = "import get from 'lodash/get'";
const LODASH_HAS = "import has from 'lodash/has'";
const LODASH_HAS_IN = "import hasIn from 'lodash/hasIn'";
const LODASH_SET = "import set from 'lodash/set'";
const LODASH_PROPERTY = "import property from 'lodash/property'";
const ARRAY_PATH = "['a', 'b']";
const STRING_PATH = "'a.b'";
const STRING_FOR_SIMPLE = "stringForSimple";
const ARRAY_FOR_VARIABLES = "arrayForVariables";
const ARRAY_MESSAGE = "array";
const STRING_MESSAGE = "string";

ruleTester.run("path-style", pathStyleRule as never, {
  invalid: [
    // --- as-needed mode ---
    // Array of literals should use string
    {
      code: `${LODASH_GET}; get(x, ${ARRAY_PATH})`,
      errors: [{ messageId: STRING_FOR_SIMPLE }],
      options: AS_NEEDED,
      output: `${LODASH_GET}; get(x, ${STRING_PATH})`
    },
    // String concat with variable should use array
    {
      code: `${LODASH_HAS}; has(x, 'a.' + y)`,
      errors: [{ messageId: ARRAY_FOR_VARIABLES }],
      options: AS_NEEDED
    },
    // Template literal with variable props should use array
    {
      code: `${LODASH_HAS}; has(x, \`a.\${y}\`)`,
      errors: [{ messageId: ARRAY_FOR_VARIABLES }],
      options: AS_NEEDED
    },
    // hasIn alias
    {
      code: `${LODASH_HAS_IN}; hasIn(x, ${ARRAY_PATH})`,
      errors: [{ messageId: STRING_FOR_SIMPLE }],
      options: AS_NEEDED,
      output: `${LODASH_HAS_IN}; hasIn(x, ${STRING_PATH})`
    },

    // --- array mode ---
    // String literal path should use array
    {
      code: `${LODASH_SET}; set(x, ${STRING_PATH}, val)`,
      errors: [{ messageId: ARRAY_MESSAGE }],
      options: ARRAY,
      output: `${LODASH_SET}; set(x, ['a', 'b'], val)`
    },
    // property method uses arg index 0
    {
      code: `${LODASH_PROPERTY}; property('a')`,
      errors: [{ messageId: ARRAY_MESSAGE }],
      options: ARRAY,
      output: `${LODASH_PROPERTY}; property(['a'])`
    },
    // Template literal in array mode
    {
      code: `${LODASH_GET}; get(x, \`a.\${y}\`)`,
      errors: [{ messageId: ARRAY_MESSAGE }],
      options: ARRAY
    },

    // --- string mode ---
    // Array expression should use string
    {
      code: `${LODASH_GET}; get(x, ${ARRAY_PATH})`,
      errors: [{ messageId: STRING_MESSAGE }],
      options: STRING,
      output: `${LODASH_GET}; get(x, ${STRING_PATH})`
    },
    // Array with numeric index
    {
      code: `${LODASH_GET}; get(x, ['a', 0, 'b'])`,
      errors: [{ messageId: STRING_MESSAGE }],
      options: STRING,
      output: `${LODASH_GET}; get(x, 'a[0].b')`
    }
  ],
  valid: [
    // --- as-needed mode ---
    {
      code: `${LODASH_GET}; get(x, ${STRING_PATH})`,
      options: AS_NEEDED
    },
    {
      code: `${LODASH_GET}; get(x, ['a', y])`,
      options: AS_NEEDED
    },
    {
      code: `${LODASH_HAS}; has(x, 'a')`,
      options: AS_NEEDED
    },
    // Non-path methods are ignored
    {
      code: "import map from 'lodash/map'; map(arr, fn)",
      options: AS_NEEDED
    },
    // Missing path argument is ignored
    {
      code: `${LODASH_GET}; get(x)`,
      options: AS_NEEDED
    },
    // Non-lodash call is ignored
    {
      code: "function myGet(x, p) { return x[p] }; myGet(obj, 'a.b')",
      options: ARRAY
    },

    // --- array mode ---
    {
      code: `${LODASH_GET}; get(x, ${ARRAY_PATH})`,
      options: ARRAY
    },

    // --- string mode ---
    {
      code: `${LODASH_GET}; get(x, ${STRING_PATH})`,
      options: STRING
    },
    {
      code: `${LODASH_PROPERTY}; property('a')`,
      options: STRING
    }
  ]
});
