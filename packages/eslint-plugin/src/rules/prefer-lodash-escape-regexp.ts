import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESLint,
  type TSESTree
} from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "preferLodashEscapeRegexp";

type Options = [];

// Check if a node is a CallExpression where the callee is a MemberExpression
// calling the "replace" method on some expression.
export const isReplaceCall = (
  node: TSESTree.Node
): node is TSESTree.CallExpression => {
  if (AST_NODE_TYPES.CallExpression !== node.type) {
    return false;
  }
  const { callee } = node;
  if (AST_NODE_TYPES.MemberExpression !== callee.type) {
    return false;
  }
  if (callee.computed) {
    return false;
  }
  if (AST_NODE_TYPES.Identifier !== callee.property.type) {
    return false;
  }
  return "replace" === callee.property.name;
};

// @typescript-eslint/parser returns regex literals as Literal, not RegExpLiteral.
const isRegexLiteral = (node: TSESTree.Node): node is TSESTree.Literal => {
  return AST_NODE_TYPES.Literal === node.type && node.value instanceof RegExp;
};

// Extract the raw regex literal text (e.g. "/pattern/g") from the node.
const getRegexLiteralRaw = (regex: TSESTree.Literal) => {
  return regex.raw;
};

// Check if the regex literal text contains a character class ([...]).
export const hasCharacterClass = (regex: TSESTree.Literal) => {
  const regexText = getRegexLiteralRaw(regex);
  return regexText.includes("[");
};

// Check if the regex literal has the global flag.
export const hasGlobalFlag = (regex: TSESTree.Literal) => {
  const regexText = getRegexLiteralRaw(regex);
  // Find the closing / by scanning for unescaped /
  let index = 1;
  while (index < regexText.length) {
    const ch = regexText[index];
    if ("\\" === ch && index + 1 < regexText.length) {
      index += 2;
    } else if ("/" === ch) {
      break;
    } else {
      index += 1;
    }
  }
  const flags = regexText.slice(index + 1);
  return flags.includes("g");
};

// Check if a Literal string contains the escaped match backreference $& or $0.
export const isEscapeReplacement = (node: TSESTree.Node) => {
  if (AST_NODE_TYPES.Literal !== node.type) {
    return false;
  }
  const value = node.value;
  if ("string" !== typeof value) {
    return false;
  }
  return value.includes("$&") || value.includes("$0");
};

export type EscapeRegexpMatch = {
  readonly call: TSESTree.CallExpression;
  readonly stringExpr: TSESTree.Expression;
};

export const detectEscapeRegexpPattern = (node: TSESTree.Node) => {
  if (!isReplaceCall(node)) {
    return null;
  }
  const [firstArgument, secondArgument] = node.arguments;
  if (!firstArgument || !secondArgument) {
    return null;
  }
  if (!isRegexLiteral(firstArgument)) {
    return null;
  }
  if (!hasCharacterClass(firstArgument)) {
    return null;
  }
  if (!hasGlobalFlag(firstArgument)) {
    return null;
  }
  if (!isEscapeReplacement(secondArgument)) {
    return null;
  }
  // Unreachable: isReplaceCall already guarantees callee is MemberExpression.
  // isReplaceCall checks AST_NODE_TYPES.MemberExpression !== callee.type and
  // returns false if not, so by the time we reach here callee.type is always
  // MemberExpression. This guard exists for TypeScript type narrowing.

  if (AST_NODE_TYPES.MemberExpression !== node.callee.type) {
    return null;
  }
  return { call: node, stringExpr: node.callee.object };
};

const UMBRELLA_DISABLE_COMMENT = `// eslint-disable-next-line @ethang/prefer-lodash`;

export const buildEscapeRegexpFix = (
  fixer: TSESLint.RuleFixer,
  match: EscapeRegexpMatch,
  sourceText: string
) => {
  const stringText = sourceText.slice(
    match.stringExpr.range[0],
    match.stringExpr.range[1]
  );
  const replacement = `escapeRegExp(${stringText})`;
  const replace = fixer.replaceText(match.call, replacement);
  const disable = fixer.insertTextBefore(
    match.call,
    `${UMBRELLA_DISABLE_COMMENT}\n`
  );
  return [replace, disable];
};

export const preferLodashEscapeRegexpRule = createRule<Options, MessageIds>({
  create(context) {
    const sourceText = context.sourceCode.text;
    const listener: TSESLint.RuleListener = {
      CallExpression: (node) => {
        const match = detectEscapeRegexpPattern(node);
        if (!match) {
          return;
        }
        context.report({
          fix: (fixer) => {
            return buildEscapeRegexpFix(fixer, match, sourceText);
          },
          messageId: "preferLodashEscapeRegexp",
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
        "Prefer `_.escapeRegExp(string)` over hand-rolled `.replace(/[...]/g, '\\\\$&')` regex-escape patterns."
    },
    fixable: "code",
    messages: {
      preferLodashEscapeRegexp:
        "Prefer `escapeRegExp(str)` over `str.replace(/[...]/g, '\\\\$&')`. Lodash ships `escapeRegExp` which handles all special regex characters."
    },
    schema: [],
    type: "problem"
  },
  name: "prefer-lodash-escape-regexp"
});
