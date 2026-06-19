import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineRule } from "../../define.ts";

export const computingFoundationsDataStructuresAlgorithms = defineRule({
  content: [
    {
      level: 1,
      text: "Computing Foundations - Data Structures and Algorithms",
      type: "header"
    },
    {
      level: 2,
      text: "1. Domain Theory and Conceptual Foundations",
      type: "header"
    },
    {
      text: "Data structures and algorithms form the core logical foundation of computer science. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 16, software engineers must understand how to represent data effectively, perform operations proficiently, and store and retrieve information efficiently. A program receives inputs, manipulates that data using logical procedures, and generates outputs. Thus, selecting appropriate data representation structures and choosing optimal algorithmic methods are critical engineering decisions that directly affect system performance, resource utilization, security, maintainability, and scalability.",
      type: "text"
    },
    {
      level: 3,
      text: "1.1 Classification of Data Structures",
      type: "header"
    },
    {
      text: "Data structures are categorized based on their logical organization, physical memory arrangement, and behavioral characteristics:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Primitive Data Types**: The basic building blocks of data representation, which correspond directly to hardware-level data formats. These include character representation, integers, floating-point numbers, Booleans, and pointer addresses. Software engineers must manage the physical memory requirements of these types, distinguishing between signed and unsigned integers, short and long variants, single and double precision floats, and character systems such as the Double Byte Character Set (DBCS)."
        },
        {
          text: "**Composite or Compound Data Types**: Formed by grouping multiple primitive or other composite types. These are subdivided into:\n- *Linear Data Structures*: Elements form a sequential sequence. Examples include one-dimensional and multi-dimensional arrays, strings (and associative skip lists), linked lists (singly linked, doubly linked, and circular lists), stacks (First-In, Last-Out), queues (First-In, First-Out), and hash tables.\n- *Non-Linear or Hierarchical Data Structures*: Represent relationships other than simple sequence. Examples include trees (binary trees, n-ary trees, B-trees, B+ trees, weighted balanced trees, AVL trees, and red-black trees), heaps (binary heaps), and graphs (directed, undirected, and acyclic graphs)."
        },
        {
          text: "**Abstract Data Types (ADTs)**: A mathematical model for data types defined solely by their behavioral semantics from the user's perspective. An ADT specifies the set of possible values and the operations that can be performed, completely hiding the underlying implementation details. Examples include list, stack, queue, and map ADTs."
        }
      ],
      type: "numberedList"
    },
    {
      level: 3,
      text: "1.2 Operations on Data Structures",
      type: "header"
    },
    {
      text: "Operations define how data within a structure is accessed, modified, or reorganized. Fundamental operations include:",
      type: "text"
    },
    {
      items: [
        {
          text: "**CRUD (Create, Read, Update, Delete)**: The baseline operations for managing elements. Software engineers must ensure that inserting or deleting elements does not violate the structural invariants of the container (such as maintaining balance in a red-black tree or avoiding duplicate keys in a set)."
        },
        {
          text: "**Traversals and Parsers**: Linear structures are traversed sequentially. Non-linear hierarchical structures require complex traversal strategies:\n- *Tree Traversals*: Pre-order (node, left, right), in-order (left, node, right), and post-order (left, right, node).\n- *Graph Traversals*: Depth-First Search (DFS, exploring along branches to maximum depth before backtracking) and Breadth-First Search (BFS, exploring neighbor nodes at the current depth before moving deeper)."
        },
        {
          text: "**Hashing**: A technique where key values of arbitrary size are converted into fixed-size hash values (codes, digests, or keys) using a hash function, which then index into a hash table for O(1) retrieval. Hash functions must exhibit properties of uniformity, efficiency, universality, determinism, and resistance to collisions. Common hash functions include division, mid-square, digit folding, multiplicative, and cryptographic vs. non-cryptographic algorithms. If different keys generate the same hash value, a collision occurs. Collision resolution techniques include open addressing (linear probing, quadratic probing, double hashing) and closed addressing (separate chaining)."
        },
        {
          text: "**Searching Techniques**: Locating specific elements within a dataset. Sequential search (linear search) traverses elements one by one. Interval search (including binary, jump, interpolation, exponential, and Fibonacci search) moves efficiently through pre-sorted lists or balanced trees."
        },
        {
          text: "**Sorting Techniques**: Arranging elements in a specified order. Popular sorting algorithms include Bubble sort, Selection sort, Insertion sort, Quick sort, Merge sort, Radix sort, Heap sort, Bucket sort, Pigeonhole sort, Bitonic sort, and Tree sort. Algorithms can be implemented using iterative or recursive methods. Iterative methods generally optimize CPU stack frames and memory, while recursive methods simplify tree operations. Software engineers must select sorting algorithms based on data size, layout (fully unsorted vs. partially sorted), memory bounds, and computational complexity."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.3 Algorithms and Complexity Analysis",
      type: "header"
    },
    {
      text: "An algorithm is a step-by-step procedure for solving a specific problem. Selecting or designing an algorithm requires balancing execution speed (time complexity) and memory consumption (space complexity). The efficiency of an algorithm is mathematically evaluated using asymptotic notations, which represent how resource consumption scales with input size (n):",
      type: "text"
    },
    {
      items: [
        {
          text: "**Big O (O)**: Defines the tight upper bound (worst-case scenario)."
        },
        {
          text: "**little-o (o)**: Depicts an upper bound that is not tight."
        },
        {
          text: "**Big Omega (Ω)**: Defines the tight lower bound (best-case scenario)."
        },
        {
          text: "**little-omega (ω)**: Depicts a lower bound that is not tight."
        },
        {
          text: "**Theta (Θ)**: Bounds the function from above and below, representing the average-case complexity."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Common algorithmic complexity classes include:",
      type: "text"
    },
    {
      items: [
        {
          text: "*Constant, O(1)*: Execution steps remain constant regardless of data size."
        },
        {
          text: "*Logarithmic, O(log n)*: Execution steps grow logarithmically (e.g., binary search)."
        },
        {
          text: "*Linear, O(n)*: Execution steps scale proportionally with input size."
        },
        {
          text: "*Quadratic, O(n^2)*: Execution steps scale quadratically (e.g., nested loops)."
        },
        {
          text: "*Cubic, O(n^3)*: Execution steps scale cubically."
        },
        {
          text: "*Exponential, O(2^n) or O(n!)*: Resource consumption grows exponentially, typical of NP-hard problems."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "1.4 Algorithmic Design Paradigms and Classes",
      type: "header"
    },
    {
      text: "Software engineers utilize diverse design paradigms depending on the problem structure:",
      type: "text"
    },
    {
      items: [
        {
          text: "**Brute Force**: Straightforward, exhaustive search of the solution space."
        },
        {
          text: "**Recursion**: Solving a problem by breaking it into smaller instances of the same problem."
        },
        {
          text: "**Divide and Conquer**: Partitioning a problem into independent sub-problems, solving them, and combining the results (e.g., Merge sort)."
        },
        {
          text: "**Dynamic Programming**: Solving optimization problems by breaking them into overlapping sub-problems and caching results (memoization) to avoid redundant calculations."
        },
        {
          text: "**Greedy Algorithms**: Making locally optimal choices at each step with the hope of finding a global optimum."
        },
        {
          text: "**Backtracking**: Systematically searching for solutions and abandoning paths as soon as they are determined to be invalid (e.g., depth-first search)."
        },
        {
          text: "**Randomized Algorithms**: Using random numbers to guide execution, such as randomized Quick sort or randomized approximation algorithms."
        }
      ],
      type: "unorderedList"
    },
    {
      text: "Specialized algorithmic domains include graph algorithms (such as Kruskal's and Prim's algorithms for minimum spanning trees, and Bellman-Ford and Dijkstra's algorithms for single-source shortest paths), sorting networks (comparison networks, zero-one principle, bitonic sorters), matrix operations, and cryptographic algorithms (symmetric key, public key, and cryptographic hash functions). Additionally, computational complexity classes classify problems based on their inherent difficulty, distinguishing between P (polynomial-time solvable), NP (non-deterministic polynomial-time verifiable), NP-complete (problems to which any NP problem can be reduced in polynomial time, as established by Cook's Theorem), and space complexity classes (Savitch's Theorem).",
      type: "text"
    },
    {
      level: 2,
      text: "2. Compliance Checklist",
      type: "header"
    },
    {
      items: [
        {
          text: "**Data Type Bounds Verification**: Have the primitive data types been selected to prevent overflow, taking into account memory size variations (signed vs. unsigned, double precision, DBCS)?"
        },
        {
          text: "**Structural Paradigm Selection**: Has the choice between linear (array, linked list, queue) and non-linear (tree, graph) structures been justified based on data access patterns?"
        },
        {
          text: "**ADT Abstraction Enforcement**: Are data structures accessed through abstract data type interfaces to decouple behavioral specifications from physical implementation details?"
        },
        {
          text: "**Structural Invariant Maintenance**: Do CRUD operations explicitly incorporate verification guards to prevent the violation of structural invariants (e.g., tree balancing)?"
        },
        {
          text: "**Tree Parser Selection**: Has the correct tree traversal strategy (pre-order, in-order, post-order) been selected for the hierarchical dataset processing loop?"
        },
        {
          text: "**Graph Search Protocol**: For network or relation datasets, has the choice between DFS and BFS been evaluated against path discovery and memory constraints?"
        },
        {
          text: "**Hash Uniformity Audit**: Has the chosen hash function been audited to verify uniform distribution of keys and minimize collision rates?"
        },
        {
          text: "**Collision Resolution Strategy**: Is there a documented collision resolution plan (separate chaining or open addressing) that handles worst-case clustering issues?"
        },
        {
          text: "**Search Strategy Alignment**: Has the search algorithm (sequential vs. interval search) been matched to the sorting status of the dataset?"
        },
        {
          text: "**Sorting Optimization Check**: Has the sorting algorithm been selected based on input size, stability requirements, and initial sorting state (unsorted vs. partially sorted)?"
        },
        {
          text: "**Recursion Depth Safety**: If using recursive algorithms, have the base cases and maximum recursion depths been validated to prevent stack overflow?"
        },
        {
          text: "**Asymptotic Complexity Analysis**: Has the time and space complexity of the implementation been mathematically evaluated and documented using Big O notation?"
        },
        {
          text: "**Worst-Case Complexity Boundaries**: Have the algorithms been verified to perform within acceptable resource bounds under worst-case inputs?"
        },
        {
          text: "**Design Paradigm Suitability**: Has the design paradigm (divide and conquer, dynamic programming, greedy, backtracking) been matched to the problem's overlapping or optimal substructure properties?"
        },
        {
          text: "**Shortest Path Timing Bounds**: If implementing routing or networking algorithms, have the shortest path methods (Dijkstra vs. Bellman-Ford) been selected based on edge weight positivity?"
        },
        {
          text: "**Cryptographic Algorithm Strength**: Have symmetric, asymmetric, and hashing algorithms been evaluated against modern cryptographic complexity requirements?"
        },
        {
          text: "**NP Complexity Class Identification**: Have problems belonging to NP-complete or NP-hard classes been identified, and are approximation or heuristic methods applied to manage execution limits?"
        },
        {
          text: "**SWEBOK Algorithm Conformance**: Are all data structure operations and algorithmic complexity measures aligned with SWEBOK v4 guidelines?"
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "computing foundations, data structures, algorithms, asymptotic notation, Big O, sorting, searching, hashing, trees, graphs, dynamic programming, recursion",
  filename: "computing-foundations-data-structures-algorithms",
  trigger: "model_decision"
});
