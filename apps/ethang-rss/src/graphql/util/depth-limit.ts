import {
  type ASTVisitor,
  type FragmentDefinitionNode,
  GraphQLError,
  Kind,
  type SelectionNode,
  type SelectionSetNode,
  type ValidationContext
} from "graphql";

const checkDepth = (
  selectionSet: SelectionSetNode,
  currentDepth: number,
  fragments: Record<string, FragmentDefinitionNode>
): number => {
  let maxSubDepth = currentDepth;
  for (const selection of selectionSet.selections) {
    const d = checkSelectionDepth(selection, currentDepth, fragments);
    if (d > maxSubDepth) {
      maxSubDepth = d;
    }
  }
  return maxSubDepth;
};

const checkSelectionDepth = (
  selection: SelectionNode,
  currentDepth: number,
  fragments: Record<string, FragmentDefinitionNode>
): number => {
  if (selection.kind === Kind.FIELD) {
    if (selection.selectionSet !== undefined) {
      return checkDepth(selection.selectionSet, currentDepth + 1, fragments);
    }
    return currentDepth;
  }

  if (selection.kind === Kind.FRAGMENT_SPREAD) {
    const fragment = fragments[selection.name.value];
    if (fragment !== undefined) {
      return checkDepth(fragment.selectionSet, currentDepth, fragments);
    }
    return currentDepth;
  }

  return checkDepth(selection.selectionSet, currentDepth, fragments);
};

export const depthLimit = (maxDepth: number) => {
  return (context: ValidationContext): ASTVisitor => {
    const fragments: Record<string, FragmentDefinitionNode> = {};

    return {
      Document: {
        enter(node) {
          for (const definition of node.definitions) {
            if (definition.kind === Kind.FRAGMENT_DEFINITION) {
              fragments[definition.name.value] = definition;
            }
          }
        }
      },
      OperationDefinition: {
        enter(node) {
          const depth = checkDepth(node.selectionSet, 0, fragments);
          if (depth > maxDepth) {
            context.reportError(
              new GraphQLError(
                `Query depth of ${depth} exceeds maximum depth of ${maxDepth}`
              )
            );
          }
        }
      }
    };
  };
};
