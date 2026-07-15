import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree
} from "@typescript-eslint/utils";
import every from "lodash/every.js";
import filter from "lodash/filter.js";
import isNil from "lodash/isNil.js";
import split from "lodash/split.js";

import { isBarrelFilename, isInsideNodeModules } from "../utils/file.ts";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type MessageIds = "noBarrelFile" | "noDeepBarrelFile";
type Options = [];

const isReExport = (node: TSESTree.Node): boolean => {
  if (
    AST_NODE_TYPES.ExportNamedDeclaration !== node.type &&
    AST_NODE_TYPES.ExportAllDeclaration !== node.type
  ) {
    return false;
  }

  if (
    AST_NODE_TYPES.ExportNamedDeclaration === node.type &&
    !isNil(node.declaration)
  ) {
    return false;
  }

  if (AST_NODE_TYPES.ExportAllDeclaration === node.type) {
    return true;
  }

  return !isNil(node.source);
};

export const noBarrelFileRule = createRule<Options, MessageIds>({
  create(context) {
    const { filename } = context;

    if (!isBarrelFilename(filename) || isInsideNodeModules(filename)) {
      return {};
    }

    const program = context.sourceCode.ast;
    const statements = program.body;

    if (0 === statements.length) {
      return {};
    }

    const isAllReExports = every(statements, isReExport);

    if (!isAllReExports) {
      return {};
    }

    const splitName = split(filename, /[\\/]/u);
    const basename = splitName.at(-1);
    const segments = filter(split(filename, /[\\/]/u), Boolean);
    const parent = segments.at(-2) ?? "";
    const messageId: "noBarrelFile" | "noDeepBarrelFile" =
      2 <= segments.length && "src" !== parent
        ? "noDeepBarrelFile"
        : "noBarrelFile";

    const [firstStatement] = statements;
    /* v8 ignore next -- unreachable: statements.length > 0 checked above */
    if (isNil(firstStatement)) {
      return {};
    }

    context.report({
      data: {
        filename: basename
      },
      messageId,
      node: firstStatement
    });

    return {};
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Ban barrel files (index.ts that re-exports from siblings). Imports must come from the source file directly."
    },
    messages: {
      noBarrelFile:
        "`{{filename}}` is a barrel file. Import directly from the source file (see AGENTS.md rule 8).",
      noDeepBarrelFile:
        "`{{filename}}` is a nested barrel file. Import directly from the source file (see AGENTS.md rule 8)."
    },
    schema: [],
    type: "problem"
  },
  name: "no-barrel-file"
});
