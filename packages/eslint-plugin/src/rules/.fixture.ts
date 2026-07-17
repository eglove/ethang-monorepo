import { parseForESLint } from "@typescript-eslint/parser";
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";

const isNodeLike = (value: unknown): value is TSESTree.Node =>
  value !== null &&
  "object" === typeof value &&
  "type" in value;

export const parseProgram = (code: string): TSESTree.Program => {
  const { ast } = parseForESLint(code, {
    ecmaVersion: 2024,
    sourceType: "module"
  });
  return ast;
};

export const expressionStatement = (
  code: string
): TSESTree.ExpressionStatement => {
  const program = parseProgram(code);
  return program.body[0] as TSESTree.ExpressionStatement;
};

export const firstExpression = (code: string): TSESTree.Expression => {
  return expressionStatement(code).expression;
};

export const firstStatement = (code: string): TSESTree.Statement => {
  return parseProgram(code).body[0] as TSESTree.Statement;
};

export const identifierExpression = (name: string): TSESTree.Identifier => {
  return { name, type: AST_NODE_TYPES.Identifier } as TSESTree.Identifier;
};

const findInProgram = <T extends TSESTree.Node>(
  code: string,
  type: string,
  helper: string
): T => {
  const program = parseProgram(code);
  const node = findFirstNode(program, (n): n is T => type === n.type);
  if (!node) {
    throw new Error(`no ${helper} found in: ${code}`);
  }
  return node;
};

export const findFirstNode = <T extends TSESTree.Node>(
  node: TSESTree.Node,
  predicate: (n: TSESTree.Node) => n is T
): T | null => {
  if (predicate(node)) {
    return node;
  }
  for (const key of Object.keys(node)) {
    if ("parent" === key) {
      continue;
    }
    const value = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (!isNodeLike(item)) {
          continue;
        }
        const found = findFirstNode(item, predicate);
        if (found) {
          return found;
        }
      }
    } else if (isNodeLike(value)) {
      const found = findFirstNode(value, predicate);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

export const findCall = (
  code: string
): { call: TSESTree.CallExpression; program: TSESTree.Program } => {
  return {
    call: findInProgram<TSESTree.CallExpression>(
      code,
      AST_NODE_TYPES.CallExpression,
      "call expression"
    ),
    program: parseProgram(code)
  };
};

export const findBinary = (
  code: string
): { binary: TSESTree.BinaryExpression; program: TSESTree.Program } => {
  return {
    binary: findInProgram<TSESTree.BinaryExpression>(
      code,
      AST_NODE_TYPES.BinaryExpression,
      "binary expression"
    ),
    program: parseProgram(code)
  };
};

export const findNew = (
  code: string
): { newExpr: TSESTree.NewExpression; program: TSESTree.Program } => {
  const program = parseProgram(code);
  const newExpr = findFirstNode(
    program,
    (n): n is TSESTree.NewExpression => AST_NODE_TYPES.NewExpression === n.type
  );
  if (!newExpr) {
    throw new Error(`no new expression found in: ${code}`);
  }
  linkParents(program);
  return { newExpr, program };
};

export const findUnary = (code: string): TSESTree.UnaryExpression => {
  return findInProgram<TSESTree.UnaryExpression>(
    code,
    AST_NODE_TYPES.UnaryExpression,
    "unary expression"
  );
};

export const findMember = (code: string): TSESTree.MemberExpression => {
  return findInProgram<TSESTree.MemberExpression>(
    code,
    AST_NODE_TYPES.MemberExpression,
    "member expression"
  );
};

export const findIdentifier = (code: string): TSESTree.Identifier => {
  return findInProgram<TSESTree.Identifier>(
    code,
    AST_NODE_TYPES.Identifier,
    "identifier"
  );
};

export const findSliceCall = (
  node: TSESTree.Node
): TSESTree.CallExpression | null => {
  return findFirstNode(node, (n): n is TSESTree.CallExpression => {
    if (AST_NODE_TYPES.CallExpression !== n.type) {
      return false;
    }
    const callee = n.callee;
    if (AST_NODE_TYPES.MemberExpression !== callee.type) {
      return false;
    }
    if (AST_NODE_TYPES.Identifier !== callee.property.type) {
      return false;
    }
    return "slice" === callee.property.name;
  });
};

export const findArrowFunction = (
  code: string
): TSESTree.ArrowFunctionExpression => {
  return findInProgram<TSESTree.ArrowFunctionExpression>(
    code,
    AST_NODE_TYPES.ArrowFunctionExpression,
    "arrow function"
  );
};

export const linkParents = (node: TSESTree.Node): void => {
  const stack: { node: TSESTree.Node; parent: TSESTree.Node | undefined }[] = [
    { node, parent: undefined }
  ];
  while (0 < stack.length) {
    const frame = stack.pop();
    if (!frame) {
      break;
    }
    const { node: current, parent } = frame;
    if (parent) {
      (current as unknown as { parent: TSESTree.Node }).parent = parent;
    }
    for (const key of Object.keys(current)) {
      if ("parent" === key) {
        continue;
      }
      const value = (current as unknown as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        for (const item of value) {
          if (isNodeLike(item)) {
            stack.push({ node: item, parent: current });
          }
        }
      } else if (isNodeLike(value)) {
        stack.push({ node: value, parent: current });
      }
    }
  }
};