import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

import { isIdentifier } from "./../utils/type-guards.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds =
  "preferLog" | "preferLogDebug" | "preferLogError" | "preferLogWarning";

type Options = [];

// Maps the console method name to the prefer-effect-log messageId that
// points the user at the right Effect replacement. Unknown methods fall
// back to the generic `preferLog` so we still flag them.
const CONSOLE_TO_EFFECT: Record<string, MessageIds> = {
  debug: "preferLogDebug",
  error: "preferLogError",
  info: "preferLog",
  log: "preferLog",
  warn: "preferLogWarning"
};

// `console.*` methods we deliberately allow. They have no Effect equivalent
// and are useful in their own right (debugging, table rendering, timing).
const ALLOWED_CONSOLE_METHODS = new Set<string>([
  "assert",
  "count",
  "countReset",
  "dir",
  "dirxml",
  "group",
  "groupCollapsed",
  "groupEnd",
  "profile",
  "profileEnd",
  "table",
  "time",
  "timeEnd",
  "timeLog",
  "timeStamp",
  "trace"
]);

const isConsoleIdentifier = (node: TSESTree.Node) => {
  return isIdentifier(node) && "console" === node.name;
};

export const preferEffectLogRule = createRule<Options, MessageIds>({
  create(context) {
    const listener: TSESLint.RuleListener = {
      CallExpression: (node) => {
        const { callee } = node;
        if (AST_NODE_TYPES.MemberExpression !== callee.type) {
          return;
        }
        if (!isConsoleIdentifier(callee.object)) {
          return;
        }
        if (callee.computed || !isIdentifier(callee.property)) {
          // `console["log"](...)` and `console.#foo(...)` — we can't
          // statically know the method name, so we leave them alone.
          return;
        }
        const { name: methodName } = callee.property;
        if (ALLOWED_CONSOLE_METHODS.has(methodName)) {
          return;
        }
        context.report({
          messageId: CONSOLE_TO_EFFECT[methodName] ?? "preferLog",
          node: callee.property
        });
      }
    };

    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Prefer `Effect.log*` over `console.*`. Map `console.log`/`console.info`→`Effect.log`, `console.warn`→`Effect.logWarning`, `console.error`→`Effect.logError`, `console.debug`→`Effect.logDebug`."
    },
    messages: {
      preferLog:
        "Use `Effect.log` instead of `console.log` / `console.info` so the message is captured by the Effect logger pipeline.",
      preferLogDebug:
        "Use `Effect.logDebug` instead of `console.debug` so the message is captured by the Effect logger pipeline.",
      preferLogError:
        "Use `Effect.logError` instead of `console.error` so the message is captured by the Effect logger pipeline.",
      preferLogWarning:
        "Use `Effect.logWarning` instead of `console.warn` so the message is captured by the Effect logger pipeline."
    },
    schema: [],
    type: "suggestion"
  },
  name: "prefer-effect-log"
});
