import { RuleTester } from "eslint";
import path from "node:path";
import { parser as tsParser } from "typescript-eslint";

import { preferEffectLogRule } from "./prefer-effect-log.ts";

const pluginDirectory = import.meta.dirname;

// `eslint-disable-next-line` directives must live in a real on-disk source
// so ESLint's directive scanner has a path to attach to. We point those
// test cases at fixture files committed under `.fixtures/prefer-effect-log/`
// that contain the disable comment + the would-be flagged line.
const fixturesRoot = path.join(
  pluginDirectory,
  ".fixtures",
  "prefer-effect-log"
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

ruleTester.run("prefer-effect-log", preferEffectLogRule as never, {
  invalid: [
    // ---------------- console.log ----------------
    {
      code: "console.log('hello');",
      errors: [{ messageId: "preferLog" }]
    },
    {
      code: "console.log('hello', 'world');",
      errors: [{ messageId: "preferLog" }]
    },
    {
      code: "console.log(`template ${value}`);",
      errors: [{ messageId: "preferLog" }]
    },
    {
      code: "console.log();",
      errors: [{ messageId: "preferLog" }]
    },
    {
      code: "console.log({ a: 1 });",
      errors: [{ messageId: "preferLog" }]
    },
    {
      code: "console.log([1, 2, 3]);",
      errors: [{ messageId: "preferLog" }]
    },
    {
      code: "arr.forEach((x) => console.log(x));",
      errors: [{ messageId: "preferLog" }]
    },
    {
      code: "if (foo) { console.log('hi'); }",
      errors: [{ messageId: "preferLog" }]
    },

    // ---------------- console.info → preferLog ----------------
    {
      code: "console.info('hello');",
      errors: [{ messageId: "preferLog" }]
    },

    // ---------------- console.warn ----------------
    {
      code: "console.warn('careful');",
      errors: [{ messageId: "preferLogWarning" }]
    },
    {
      code: "console.warn(`warn ${x}`);",
      errors: [{ messageId: "preferLogWarning" }]
    },

    // ---------------- console.error ----------------
    {
      code: "console.error('boom');",
      errors: [{ messageId: "preferLogError" }]
    },
    {
      code: "console.error(new Error('boom'));",
      errors: [{ messageId: "preferLogError" }]
    },

    // ---------------- console.debug ----------------
    {
      code: "console.debug('debug');",
      errors: [{ messageId: "preferLogDebug" }]
    },

    // ---------------- unknown console method falls back to preferLog ----------------
    {
      code: "console.fancy('nope');",
      errors: [{ messageId: "preferLog" }]
    },

    // ---------------- multiple console calls in one snippet ----------------
    {
      code: "console.log('a'); console.error('b');",
      errors: [{ messageId: "preferLog" }, { messageId: "preferLogError" }]
    }
  ],
  valid: [
    // ---------------- Effect.log* is the preferred API ----------------
    {
      code: "import { Effect } from 'effect'; Effect.log('hello');"
    },
    {
      code: "import { Effect } from 'effect'; Effect.logWarning('careful');"
    },
    {
      code: "import { Effect } from 'effect'; Effect.logError('boom');"
    },
    {
      code: "import { Effect } from 'effect'; Effect.logDebug('debug');"
    },
    {
      code: "import { Effect } from 'effect'; Effect.logInfo('info');"
    },

    // ---------------- allowed console methods have no Effect equivalent ----------------
    {
      code: "console.dir(obj);"
    },
    {
      code: "console.table(rows);"
    },
    {
      code: "console.time('render');"
    },
    {
      code: "console.timeEnd('render');"
    },
    {
      code: "console.timeLog('render');"
    },
    {
      code: "console.timeStamp('render');"
    },
    {
      code: "console.count('hits');"
    },
    {
      code: "console.countReset('hits');"
    },
    {
      code: "console.group('block');"
    },
    {
      code: "console.groupCollapsed('block');"
    },
    {
      code: "console.groupEnd();"
    },
    {
      code: "console.assert(value);"
    },
    {
      code: "console.dirxml(node);"
    },
    {
      code: "console.profile('cpu');"
    },
    {
      code: "console.profileEnd('cpu');"
    },
    {
      code: "console.trace('here');"
    },

    // ---------------- computed property access: we can't statically know the method ----------------
    {
      code: "console['log']('hi');"
    },
    {
      code: "console['fancy']('hi');"
    },

    // ---------------- a non-console receiver isn't flagged ----------------
    {
      code: "logger.log('hi');"
    },
    {
      code: "log.log('hi');"
    },
    {
      code: "global.console.log('hi');"
    },

    // ---------------- a bare `console` reference isn't flagged ----------------
    {
      code: "const c = console;"
    },
    {
      code: "console; // bare reference"
    },

    // ---------------- call expression on console without member access isn't flagged ----------------
    {
      code: "console();"
    },

    // ---------------- eslint-disable directive suppresses the rule (must live in an on-disk fixture) ----------------
    {
      ...fixture("valid-eslint-disable-next-line"),
      code: "// eslint-disable-next-line rule-to-test/prefer-effect-log\nconsole.log('ok');"
    },
    {
      ...fixture("valid-eslint-disable-block"),
      code: "/* eslint-disable rule-to-test/prefer-effect-log */\nconsole.log('ok');"
    }
  ]
});
