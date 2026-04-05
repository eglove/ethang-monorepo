import { ErrorKind, ok, type Result, resultError } from "./result.ts";

const buildGraph = (
  edges: readonly (readonly [number, number])[],
): Result<{
  adjacency: Map<number, number[]>;
  inDegree: Map<number, number>;
  nodes: Set<number>;
}> => {
  const nodes = new Set<number>();
  const adjacency = new Map<number, number[]>();
  const inDegree = new Map<number, number>();

  for (const [from, to] of edges) {
    if (from === to) {
      return resultError(ErrorKind.ValidationError, "Self-loop detected");
    }

    nodes.add(from);
    nodes.add(to);

    const neighbors = adjacency.get(from) ?? [];
    neighbors.push(to);
    adjacency.set(from, neighbors);

    inDegree.set(to, (inDegree.get(to) ?? 0) + 1);

    if (!inDegree.has(from)) {
      inDegree.set(from, 0);
    }
  }

  return ok({ adjacency, inDegree, nodes });
};

const topologicalSort = (
  adjacency: Map<number, number[]>,
  inDegree: Map<number, number>,
  nodeCount: number,
): boolean => {
  const queue: number[] = [];

  for (const [node, degree] of inDegree) {
    if (0 === degree) {
      queue.push(node);
    }
  }

  let processed = 0;

  while (0 < queue.length) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const current = queue.shift()!;
    processed += 1;

    for (const neighbor of adjacency.get(current) ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const newDegree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDegree);

      if (0 === newDegree) {
        queue.push(neighbor);
      }
    }
  }

  return processed >= nodeCount;
};

export const isDAG = (
  edges: readonly (readonly [number, number])[],
): Result<true> => {
  if (0 === edges.length) {
    return ok(true);
  }

  const graphResult = buildGraph(edges);

  if (!graphResult.ok) {
    return graphResult;
  }

  const { adjacency, inDegree, nodes } = graphResult.value;
  const isAcyclic = topologicalSort(adjacency, inDegree, nodes.size);

  if (!isAcyclic) {
    return resultError(
      ErrorKind.ValidationError,
      "Circular subscription detected",
    );
  }

  return ok(true);
};
