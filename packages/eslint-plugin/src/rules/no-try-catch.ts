import { ESLintUtils, type TSESLint } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "noCatch" | "noThrow" | "noTry";
type Options = [];

export const noTryCatchRule = createRule<Options, MessageIds>({
  create(context) {
    const listener: TSESLint.RuleListener = {
      CatchClause(node) {
        context.report({
          messageId: "noCatch",
          node
        });
      },
      ThrowStatement(node) {
        context.report({
          messageId: "noThrow",
          node
        });
      },
      TryStatement(node) {
        context.report({
          messageId: "noTry",
          node
        });
      }
    };

    return listener;
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Ban `try`/`catch`/`throw`. Use the Effect typed error system (`Effect.try`, `Effect.tryPromise`, `Effect.catchTag`, `Effect.catchAll`, `Effect.fail`) instead."
    },
    messages: {
      noCatch:
        "Do not use `catch` clauses. Use `Effect.catchTag` / `Effect.catchAll` instead.",
      noThrow: "Do not use `throw`. Use `Effect.fail` / `Effect.die` instead.",
      noTry:
        "Do not use `try` statements. Use `Effect.try` / `Effect.tryPromise` instead."
    },
    schema: [],
    type: "problem"
  },
  name: "no-try-catch"
});
