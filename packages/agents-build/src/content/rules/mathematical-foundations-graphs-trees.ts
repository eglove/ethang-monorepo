import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const mathematicalFoundationsGraphsTrees = defineRule({
  content: [
    {
      level: 1,
      text: "Mathematical Foundations - Graphs and Trees",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Graph theory and tree structures form the primary mathematical framework for modeling relationships, hierarchies, dependency networks, and flow pathways in software engineering. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 17, Section 4, graphs and trees are essential discrete structures used to analyze and solve problems in software construction, network routing, compilers, database optimization, and scheduling. Understanding the mathematical constraints and behavioral properties of these structures enables engineers to design efficient algorithms, analyze computational complexity, and maintain correct software architectures.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Fundamental Graph Concepts and Classifications",
      type: "header"
    },
    {
      text: "A graph G is formally defined as an ordered pair G = (V, E), where V is a non-empty set of vertices (or nodes) and E is a set of edges (or arcs, links) connecting pairs of vertices.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Simple Undirected Graphs**: In a simple graph, each edge connects two distinct vertices, and no two edges connect the same pair of vertices. The edges are undirected, meaning the relationship is symmetric, denoted as unordered pairs {A, B}."
        },
        {
          text: "**Multigraphs**: A multigraph allows multiple edges (or parallel edges) to connect the same pair of vertices, representing multiple associations or redundant channels between the same entities."
        },
        {
          text: "**Pseudographs**: A pseudograph allows both multiple edges and self-loops (edges connecting a vertex to itself), which are key for modeling self-referential transitions."
        },
        {
          text: "**Directed Graphs (Digraphs)**: A directed graph consists of vertices V and directed edges E that are ordered pairs. For an edge (u, v), u is the initial source and v is the terminal target."
        },
        {
          text: "**Weighted Graphs**: In a weighted graph, each edge has a numerical weight representing cost, distance, capacity, or latency between vertices."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.2 Graph Neighborhoods and Degrees",
      type: "header"
    },
    {
      text: "In an undirected graph, two vertices u and v are adjacent if there is an edge e = {u, v} connecting them. Edge e is incident with u and v. The degree of a vertex v, deg(v), is the number of incident edges, with self-loops counting twice.",
      type: "text"
    },
    {
      items: [
        {
          text: "An **isolated vertex** has degree zero (no connections)."
        },
        {
          text: "A **pendant vertex** has degree one (connected by one edge)."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "In a directed graph, the degree of a vertex v is the sum of its in-degree (deg-(v), edges terminating at v) and out-degree (deg+(v), edges originating from v). A loop contributes one to both. The handshaking lemma states that the sum of all vertex degrees in an undirected graph equals twice the number of edges.",
      type: "text"
    },
    {
      level: 3,
      text: "1.3 Paths, Circuits, and Cycles",
      type: "header"
    },
    {
      text: "A path of length n is a sequence of n adjacent edges from u to v.",
      type: "text"
    },
    {
      items: [
        {
          text: "A path is a **circuit** if u = v."
        },
        {
          text: "A path is **simple** if it contains no edge more than once."
        },
        {
          text: "A **cycle** Cn (n >= 3) is a simple graph with vertices v1..vn and edges {v1, v2}..{vn, v1}."
        },
        {
          text: "In directed graphs, paths and cycles must follow edge directions."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Graph Representation Models",
      type: "header"
    },
    {
      text: "SWEBOK v4 references three standard models for representing graphs in memory:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Adjacency List**: Maps each vertex to a list of its neighbors. It is highly space-efficient for sparse graphs, requiring O(V + E) space."
        },
        {
          text: "**Adjacency Matrix**: A V x V 2D array where entry (i, j) indicates edge existence or weight. It offers O(1) edge lookups but requires O(V^2) space, suited for dense graphs."
        },
        {
          text: "**Incidence Matrix**: A V x E 2D array mapping vertices to edges. Useful for topological analysis but less common in code due to its O(V * E) space footprint."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.5 Tree Structures and Hierarchical Properties",
      type: "header"
    },
    {
      text: "A tree T = (N, E) is a connected undirected graph with no simple circuits, consisting of nodes N and edges E (|E| = |N| - 1). A tree features a unique path between any two vertices; removing any edge disconnects it.",
      type: "text"
    },
    {
      items: [
        {
          text: "**Hierarchical Structure**: Unlike flat graphs, trees define parent-child relationships. Every node except the root has exactly one parent."
        },
        {
          text: "**Terminology**: Siblings share a parent. An internal node has children; a leaf node has none."
        },
        {
          text: "**Distance Metrics**: A node's level is its path length from the root (level 0). Tree height is the maximum level of any node."
        },
        {
          text: "**Lineage**: Ancestors lie on the path from the root to a node; descendants have that node as an ancestor."
        },
        {
          text: "**Ordering**: Sibling order is significant in an ordered tree and arbitrary in an unordered tree."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.6 Binary Trees and Search Trees",
      type: "header"
    },
    {
      text: "A binary tree is an ordered tree where each node has at most two children, designated as the left child and the right child.",
      type: "text"
    },
    {
      items: [
        {
          text: "A **full binary tree** (or strictly binary tree) is a binary tree in which every internal node has exactly two children."
        },
        {
          text: "A **complete binary tree** is a binary tree in which all levels are completely filled except possibly the last level, which is filled from left to right."
        },
        {
          text: "A **balanced binary tree** of height H is one where all leaf nodes occur at levels H or H - 1. Balancing is critical for maintaining O(log N) search, insertion, and deletion times."
        },
        {
          text: "A **binary search tree (BST)** is a binary tree where each node contains a key. The key in any node is greater than all keys in its left subtree and less than all keys in its right subtree. This ordering constraint enables binary search operations on dynamic datasets."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.7 Systematic Traversal Algorithms",
      type: "header"
    },
    {
      text: "Tree traversal is the process of visiting every node in a tree exactly once. Because of their recursive structure, tree traversals are defined recursively:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Preorder Traversal**: Visit the root node, traverse the left subtree, and then traverse the right subtree. The order is Root, Left, Right. Preorder traversal is commonly used to clone or duplicate a tree structure, as it processes the parent node before its children."
        },
        {
          text: "**In-order Traversal**: Traverse the left subtree, visit the root node, and then traverse the right subtree. The order is Left, Root, Right. For a Binary Search Tree, an in-order traversal visits the keys in strictly ascending sorted order, which is the mathematical basis for tree-sort algorithms."
        },
        {
          text: "**Postorder Traversal**: Traverse the left subtree, traverse the right subtree, and then visit the root node. The order is Left, Right, Root. Postorder is useful for evaluating postfix expressions, deleting tree nodes, or calculating folder sizes. All depth-first traversals have a time complexity of O(N) and a space complexity of O(H) due to the call stack size, where H is the tree height."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "**Graph Classification**: Has the relationship structure been formally classified (simple graph, multigraph, pseudograph, directed, or weighted) to select the appropriate algorithmic constraints?"
        },
        {
          text: "**Vertex and Edge Definition**: Are the vertex set V, edge set E, and the edge-to-vertex mapping function F formally defined?"
        },
        {
          text: "**Degree and Flow Validation**: For directed graphs, have in-degrees and out-degrees been evaluated to detect sinks, sources, or potential bottlenecks in flow networks?"
        },
        {
          text: "**Loop and Parallel Edge Constraints**: Does the system logic enforce constraints regarding loops and parallel edges as dictated by the chosen graph classification?"
        },
        {
          text: "**Representation Model Trade-offs**: Has the graph representation (adjacency list, adjacency matrix, or incidence matrix) been selected based on graph density and performance requirements?"
        },
        {
          text: "**Path and Circuit Correctness**: Have pathing algorithms been verified to ensure they correctly identify simple paths, circuits, and cycles?"
        },
        {
          text: "**Tree Constraint Verification**: Has it been verified that the tree structure satisfies the constraint |E| = |N| - 1 and contains no simple circuits?"
        },
        {
          text: "**Root Node Definition**: Is there a single, clearly designated root node for every hierarchical structure to establish a valid entry point?"
        },
        {
          text: "**Parent-Child Hierarchy Audit**: Has it been verified that every non-root node in the tree has exactly one parent?"
        },
        {
          text: "**Sibling and Level Properties**: Are sibling nodes and node levels correctly computed to ensure proper distance metrics from the root?"
        },
        {
          text: "**Leaf Node Identification**: Are leaf nodes correctly identified (having zero children) to establish terminal states in recursive algorithms?"
        },
        {
          text: "**Tree Height and Balance Analysis**: Has the height of the tree been measured, and is there a balancing mechanism to prevent performance degradation to O(N)?"
        },
        {
          text: "**Ordered vs. Unordered Trees**: Has the significance of sibling order been specified, and does the code preserve or ignore this order accordingly?"
        },
        {
          text: "**Binary Tree Classification**: If using a binary tree, has it been classified as full, complete, or balanced to verify its structural invariants?"
        },
        {
          text: "**Binary Search Tree Invariants**: For Binary Search Trees, does the insertion and deletion logic maintain the key ordering invariant (Left < Root < Right) for all nodes?"
        },
        {
          text: "**Preorder Traversal Implementation**: Is the preorder traversal correctly implemented using the recursive pattern of visiting the root before its subtrees?"
        },
        {
          text: "**In-order Traversal Implementation**: Is the in-order traversal correctly implemented, and does it yield sorted elements when applied to a binary search tree?"
        },
        {
          text: "**Postorder Traversal Implementation**: Is the postorder traversal correctly implemented and used for bottom-up operations like node deletion or expression evaluation?"
        },
        {
          text: "**Memory and Space Complexity Analysis**: Has the memory footprint of the discrete structures been profiled to ensure they scale efficiently with large datasets?"
        },
        {
          text: "**Algorithmic Correctness**: Have graph traversal algorithms (such as depth-first or breadth-first search) been validated against cycle-containing graphs using visited-state flags?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "graph theory, trees, simple graph, multigraph, pseudograph, directed graph, weighted graph, degree, path, cycle, adjacency list, adjacency matrix, incidence matrix, binary tree, binary search tree, preorder, inorder, postorder",
  filename: "mathematical-foundations-graphs-trees",
  trigger: "model_decision"
});
