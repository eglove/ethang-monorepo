import { RuleTester } from "eslint";

import { importScopeRule } from "./import-scope.ts";

const ruleTester = new RuleTester();

const LODASH = "lodash";
const LODASH_MAP = "lodash/map";
const LODASH_DOT_MAP = "lodash.map";
const LODASH_ES = "lodash-es";
const LODASH_ES_MAP = "lodash-es/map";
const MAP = "map";
const REACT = "react";
const OTHER_LIB = "other-lib";
const SOMETHING = "something";
const FILTER_AS_F = "filter as f";
const METHOD_MESSAGE = "method";
const MEMBER_MESSAGE = "member";
const FULL_MESSAGE = "full";
const METHOD_PACKAGE_MESSAGE = "method-package";
const MEMBER_MODE = ["member"];
const FULL_MODE = ["full"];
const METHOD_PACKAGE_MODE = ["method-package"];

ruleTester.run("import-scope", importScopeRule as never, {
  invalid: [
    // --- method mode (default) ---
    // Full import with default specifier
    {
      code: `import _ from '${LODASH}'`,
      errors: [{ messageId: METHOD_MESSAGE }]
    },
    // Full import with namespace specifier
    {
      code: `import * as _ from '${LODASH}'`,
      errors: [{ messageId: METHOD_MESSAGE }]
    },
    // Full import with named specifiers
    {
      code: `import {${MAP}} from '${LODASH}'`,
      errors: [{ messageId: METHOD_MESSAGE }]
    },
    // Method-package import (lodash.map) when method is preferred
    {
      code: `import ${MAP} from '${LODASH_DOT_MAP}'`,
      errors: [{ messageId: METHOD_MESSAGE }]
    },
    // CommonJS require full
    {
      code: `const _ = require('${LODASH}')`,
      errors: [{ messageId: METHOD_MESSAGE }]
    },
    // CommonJS require with destructuring
    {
      code: `const {${MAP}} = require('${LODASH}')`,
      errors: [{ messageId: METHOD_MESSAGE }]
    },
    // CommonJS require method-package
    {
      code: `const ${MAP} = require('${LODASH_DOT_MAP}')`,
      errors: [{ messageId: METHOD_MESSAGE }]
    },

    // --- member mode ---
    {
      code: `import _ from '${LODASH}'`,
      errors: [{ messageId: MEMBER_MESSAGE }],
      options: MEMBER_MODE
    },
    {
      code: `import ${MAP} from '${LODASH_MAP}'`,
      errors: [{ messageId: MEMBER_MESSAGE }],
      options: MEMBER_MODE
    },
    {
      code: `import ${MAP} from '${LODASH_DOT_MAP}'`,
      errors: [{ messageId: MEMBER_MESSAGE }],
      options: MEMBER_MODE
    },
    {
      code: `const _ = require('${LODASH}')`,
      errors: [{ messageId: MEMBER_MESSAGE }],
      options: MEMBER_MODE
    },
    {
      code: `const ${MAP} = require('${LODASH_MAP}')`,
      errors: [{ messageId: MEMBER_MESSAGE }],
      options: MEMBER_MODE
    },

    // --- full mode ---
    {
      code: `import ${MAP} from '${LODASH_MAP}'`,
      errors: [{ messageId: FULL_MESSAGE }],
      options: FULL_MODE
    },
    {
      code: `import {${MAP}} from '${LODASH}'`,
      errors: [{ messageId: FULL_MESSAGE }],
      options: FULL_MODE
    },
    {
      code: `import ${MAP} from '${LODASH_DOT_MAP}'`,
      errors: [{ messageId: FULL_MESSAGE }],
      options: FULL_MODE
    },

    // --- method-package mode ---
    {
      code: `import _ from '${LODASH}'`,
      errors: [{ messageId: METHOD_PACKAGE_MESSAGE }],
      options: METHOD_PACKAGE_MODE
    },
    {
      code: `import ${MAP} from '${LODASH_MAP}'`,
      errors: [{ messageId: METHOD_PACKAGE_MESSAGE }],
      options: METHOD_PACKAGE_MODE
    },
    {
      code: `import {${MAP}} from '${LODASH}'`,
      errors: [{ messageId: METHOD_PACKAGE_MESSAGE }],
      options: METHOD_PACKAGE_MODE
    },

    // --- lodash-es variants ---
    {
      code: `import _ from '${LODASH_ES}'`,
      errors: [{ messageId: METHOD_MESSAGE }]
    },
    {
      code: `import ${MAP} from '${LODASH_ES_MAP}'`,
      errors: [{ messageId: MEMBER_MESSAGE }],
      options: MEMBER_MODE
    }
  ],
  valid: [
    // --- method mode (default) ---
    {
      code: `import ${MAP} from '${LODASH_MAP}'`
    },
    {
      code: `import ${MAP} from '${LODASH_ES_MAP}'`
    },
    {
      code: `const ${MAP} = require('${LODASH_MAP}')`
    },
    // Non-lodash imports
    {
      code: `import React from '${REACT}'`
    },
    {
      code: `import {${SOMETHING}} from '${OTHER_LIB}'`
    },
    // Non-require variable declaration
    {
      code: `const ${MAP} = someFunction()`
    },
    {
      code: `const ${MAP} = 42`
    },

    // --- member mode ---
    {
      code: `import {${MAP}} from '${LODASH}'`,
      options: MEMBER_MODE
    },
    {
      code: `import {${FILTER_AS_F}} from '${LODASH}'`,
      options: MEMBER_MODE
    },
    {
      code: `const {${MAP}} = require('${LODASH}')`,
      options: MEMBER_MODE
    },

    // --- full mode ---
    {
      code: `import _ from '${LODASH}'`,
      options: FULL_MODE
    },
    {
      code: `import * as _ from '${LODASH}'`,
      options: FULL_MODE
    },
    {
      code: `const _ = require('${LODASH}')`,
      options: FULL_MODE
    },

    // --- method-package mode ---
    {
      code: `import ${MAP} from '${LODASH_DOT_MAP}'`,
      options: METHOD_PACKAGE_MODE
    },
    {
      code: `const ${MAP} = require('${LODASH_DOT_MAP}')`,
      options: METHOD_PACKAGE_MODE
    }
  ]
});
