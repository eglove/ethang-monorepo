import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree
} from "@typescript-eslint/utils";
import every from "lodash/every.js";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";

const createRule = ESLintUtils.RuleCreator((name) => {
  return `https://github.com/eglove/ethang-monorepo/blob/master/packages/eslint-plugin/src/rules/${name}.ts`;
});

type ImportType = "full" | "member" | "method-package" | "method";

type MessageIds = "full" | "member" | "method-package" | "method";

type Options = [ImportType?];

const REQUIRE = "require";
const FULL_PATTERN = /^lodash(-es)?\/?$/u;
const METHOD_PATTERN = /^lodash(-es\/|[./])(?!fp)\w+$/u;
const DOT = ".";
const METHOD = "method";
const METHOD_PACKAGE = "method-package";
const MEMBER = "member";
const FULL = "full";

// Matches 'lodash', 'lodash/', 'lodash-es', 'lodash-es/'
export const isFullLodashImport = (source: string) => {
  return FULL_PATTERN.test(source);
};

const isLodashMethodImport = (source: string) => {
  return METHOD_PATTERN.test(source);
};

// Matches 'lodash/map', 'lodash-es/map' — method imports (with slash)
export const isMethodImport = (source: string) => {
  return isLodashMethodImport(source) && !includes(source, DOT);
};

// Matches 'lodash.map' — method-package imports (with dot)
export const isMethodPackageImport = (source: string) => {
  return isLodashMethodImport(source) && includes(source, DOT);
};

// Gets the imported module name from a CommonJS require() call
export const getNameFromCjsRequire = (init: null | TSESTree.Expression) => {
  if (init?.type !== AST_NODE_TYPES.CallExpression) {
    return null;
  }

  const { callee } = init;

  if (
    callee.type !== AST_NODE_TYPES.Identifier ||
    REQUIRE !== callee.name ||
    1 !== init.arguments.length
  ) {
    return null;
  }

  const [argument] = init.arguments;

  if (argument?.type !== AST_NODE_TYPES.Literal) {
    return null;
  }

  const { value } = argument;

  return isString(value) ? value : null;
};

const importNodeTypes: Record<ImportType, string[]> = {
  [FULL]: ["ImportDefaultSpecifier", "ImportNamespaceSpecifier"],
  [MEMBER]: ["ImportSpecifier"],
  [METHOD]: ["ImportDefaultSpecifier"],
  [METHOD_PACKAGE]: ["ImportDefaultSpecifier"]
};

const isAllImportsOfType = (
  node: TSESTree.ImportDeclaration,
  types: string[]
) => {
  return every(node.specifiers, (specifier) => {
    return includes(types, specifier.type);
  });
};

const isMethodOrMethodPackage = (importType: ImportType) => {
  return importType === METHOD || importType === METHOD_PACKAGE;
};

const isWrongMethodImport = (source: string, importType: ImportType) => {
  return (
    (isMethodImport(source) && importType !== METHOD) ||
    (isMethodPackageImport(source) && importType !== METHOD_PACKAGE)
  );
};

const reportFullImport = (
  context: Readonly<{
    report: (argument: { messageId: MessageIds; node: TSESTree.Node }) => void;
  }>,
  importType: ImportType,
  node: TSESTree.Node,
  declaration: null | TSESTree.ImportDeclaration
) => {
  if (
    isMethodOrMethodPackage(importType) ||
    (!isNil(declaration) &&
      !isAllImportsOfType(declaration, importNodeTypes[importType]))
  ) {
    context.report({ messageId: importType, node });
  }
};

export const importScopeRule = createRule<Options, MessageIds>({
  create(context) {
    const [importType = METHOD] = context.options;

    const reportImportDeclaration = (node: TSESTree.ImportDeclaration) => {
      const source = node.source.value;

      if (isFullLodashImport(source)) {
        reportFullImport(context, importType, node, node);
        return;
      }

      if (isWrongMethodImport(source, importType)) {
        context.report({ messageId: importType, node });
      }
    };

    const reportVariableDeclarator = (node: TSESTree.VariableDeclarator) => {
      const name = getNameFromCjsRequire(node.init);

      if (isNil(name)) {
        return;
      }

      if (isFullLodashImport(name)) {
        if (isMethodOrMethodPackage(importType)) {
          context.report({ messageId: importType, node });
          return;
        }

        const isObjectPattern = node.id.type === AST_NODE_TYPES.ObjectPattern;
        const isMemberImport = importType === MEMBER;

        if (isObjectPattern !== isMemberImport) {
          context.report({ messageId: importType, node });
        }

        return;
      }

      if (isWrongMethodImport(name, importType)) {
        context.report({ messageId: importType, node });
      }
    };

    return {
      ImportDeclaration: reportImportDeclaration,
      VariableDeclarator: reportVariableDeclarator
    };
  },
  defaultOptions: [METHOD],
  meta: {
    docs: {
      description:
        "Enforce a specific Lodash import scope (method, member, full, or method-package)."
    },
    messages: {
      full: "Use the full Lodash module.",
      member: "Import members from the full Lodash module.",
      method: "Import individual methods from the Lodash module.",
      "method-package":
        "Import Lodash methods only from method packages (e.g. lodash.map)."
    },
    schema: [
      {
        enum: [METHOD, MEMBER, FULL, METHOD_PACKAGE],
        type: "string"
      }
    ],
    type: "problem"
  },
  name: "import-scope"
});
