export const ch16Computing = {
  content: `# Computing Foundations (SWEBOK v4, Chapter 16)

> Scope: computer science concepts a software engineer must command to architect, design, construct, and maintain software — algorithm complexity, data structures, OOP, databases, OS, networking, AI/ML. Theory lives here; stack-specific design checks live in the review-design-checklist overlay.

## When to Apply

- Selecting or justifying an algorithm given expected data volume (Big-O review)
- Choosing a data structure for a new feature (access pattern analysis)
- Designing or reviewing a database schema (normalization, ACID vs BASE)
- Evaluating distributed vs. parallel approach for a service
- Reviewing OOP class design for encapsulation, inheritance, and polymorphism correctness

## Key Definitions

| Term | Definition |
|---|---|
| **Big-O / O(f(n))** | Upper bound on worst-case resource consumption as input size n grows |
| **ADT** | Abstract Data Type — defined by behavior (valid operations), not by implementation |
| **Normalization** | Organizing relational data to eliminate redundancy and update anomalies |
| **ACID** | Atomicity, Consistency, Isolation, Durability — relational transaction guarantee |
| **BASE** | Basically Available, Soft state, Eventually consistent — NoSQL relaxed consistency model |
| **ISA** | Instruction Set Architecture — abstract model of how a CPU executes instructions |
| **IPC** | Inter-Process Communication — pipes, shared memory, semaphores, message queues |
| **HCI** | Human-Computer Interface — design discipline for user interaction with computing systems |
| **OSI** | Open Systems Interconnection — 7-layer reference model for network communication |

## Algorithm Complexity

### Asymptotic Notations

| Notation | Meaning |
|---|---|
| **O(f(n))** | Upper bound — worst case |
| **Ω(f(n))** | Lower bound — best case |
| **Θ(f(n))** | Tight bound — average case |
| **o(f(n))** | Non-tight upper bound |
| **ω(f(n))** | Non-tight lower bound |

### Complexity Classes and Review Thresholds

| Class | Notation | Acceptable When | Not Acceptable When |
|---|---|---|---|
| Constant | O(1) | Always | — |
| Logarithmic | O(log n) | Always | — |
| Linear | O(n) | Always | — |
| Log-linear | O(n log n) | Large n (preferred for sorts) | — |
| Quadratic | O(n²) | n ≤ ~10,000 with profiling evidence | Unbounded/production data sets; any loop-in-loop on DB result sets |
| Cubic | O(n³) | Tiny fixed-size matrices only | Any user-driven or unbounded data |
| Exponential | O(2ⁿ), O(n!) | Never in production paths | Any n > ~20 |

**Rule**: every algorithm choice must be justified against the expected production data volume. Profiling evidence required before accepting O(n²) or worse on any path that scales with user data.

### Algorithm Design Strategies

| Strategy | When to Use |
|---|---|
| Divide & Conquer | Recursive decomposition; merge sort, binary search |
| Dynamic Programming | Overlapping subproblems with optimal substructure |
| Greedy | Local optimum leads to global optimum; scheduling, Huffman coding |
| Backtracking | Constraint satisfaction; prune invalid paths early |
| Brute Force | Only for tiny fixed inputs; never on user-scaled data |

Prefer iterative over recursive for CPU performance and memory; use recursion where the problem is naturally recursive (tree traversal, divide & conquer).

## Data Structure Selection

Match structure to access pattern. Wrong structure raises effective complexity.

| Access Pattern | Preferred Structure | Complexity |
|---|---|---|
| Keyed lookup | Hash Map / Hash Table | O(1) avg |
| Ordered traversal / range query | BST, AVL Tree | O(log n) |
| Ordered range query on disk / index | B-Tree, B+ Tree | O(log n) |
| Frequent insert/delete with ordered access | Red-Black Tree | O(log n) |
| LIFO | Stack | O(1) |
| FIFO | Queue | O(1) |
| Priority ordering | Heap / Priority Queue | O(log n) |
| Hierarchical relationships | Tree | varies |
| Arbitrary relationships / shortest paths | Graph | varies |
| Sequential indexed access | Array | O(1) |

**Categories**: Primitive (int, float, bool, char, pointer) → Linear (array, linked list, stack, queue, hash table) → Hierarchical/Nonlinear (tree, heap, graph) → ADT (defined by behavior, not implementation).

Key operations: CRUD; sort (Quick O(n log n) avg, Merge O(n log n) stable, Heap O(n log n) in-place); search (Linear O(n), Binary O(log n), Hash O(1) avg); hash collision resolution (linear probing, quadratic probing, separate chaining).

## Object-Oriented Programming

### Four Pillars

| Pillar | Definition | Review Signal |
|---|---|---|
| **Abstraction** | Expose only required interface; hide implementation | Public API exposes no internal types or state |
| **Encapsulation** | Bundle data + methods; control access via modifiers | No public mutable fields; internals not leaked through getters |
| **Inheritance** | Subclass inherits superclass attributes and methods | Liskov Substitution holds — subclass is usable everywhere superclass is expected |
| **Polymorphism** | Single interface, multiple implementations; overloading (compile-time) and overriding (runtime) | No long if/switch chains discriminating on type — use polymorphism instead |

## Database Management

### Database Type Selection

| Requirement | Choose |
|---|---|
| Structured data, complex joins, strong consistency | Relational (RDBMS) — e.g. PostgreSQL via Drizzle ORM |
| Flexible schema, high write volume, horizontal scaling | NoSQL (document, key-value, column-family) |
| Highly connected data where relationships are first-class | Graph DB |
| Temporal queries on sensor/metric/log data | Time Series DB |

### ACID vs BASE Decision

| Criterion | ACID (relational) | BASE (NoSQL) |
|---|---|---|
| Consistency requirement | Strong — all reads see committed state | Eventual — replicas converge over time |
| Use when | Finance, banking, order management, any money movement | High-volume reads, recommendation engines, session stores |
| Failure behavior | Transaction rolls back atomically | Partition-tolerant; may serve stale data |
| Horizontal scale | Harder (sharding complexity) | Native |

**Rule**: default to ACID for any workload involving money, audit trails, or referential integrity. Justify BASE explicitly when eventual consistency is provably acceptable.

### Normalization Decision Rules

| Normal Form | Eliminates | Apply When |
|---|---|---|
| **1NF** | Repeating groups; non-atomic values | Always — no exceptions |
| **2NF** | Partial key dependency | Any composite primary key |
| **3NF** | Transitive dependency | Default target for all new schemas |
| **BCNF** | All functional dependencies not from superkey | When 3NF anomalies remain after analysis |
| **4NF** | Multivalued dependencies | Rarely; only when multivalued facts are present |
| **5NF** | Join dependencies | Almost never; extreme normalization only |

**Stop rule**: normalize to 3NF or BCNF by default. De-normalize (intentionally add redundancy) only with documented rationale and measured query-performance evidence. De-normalization reintroduces update anomalies — document the trade-off explicitly.

### SQL Rules
- DDL (schema), DML (data), DCL (access control), TCL (transactions) — know which layer each statement belongs to
- \`SELECT *\` in production is an anti-pattern — always specify needed columns
- Every \`UPDATE\` / \`DELETE\` must have a \`WHERE\` clause unless full-table operation is explicitly intended

## Computer Networks

### OSI Model — 7 Layers

| Layer | Name | Responsibility |
|---|---|---|
| 7 | Application | HTTP, FTP, SMTP, DNS — user-facing protocols |
| 6 | Presentation | Encryption, compression, data format translation |
| 5 | Session | Session establishment, maintenance, termination |
| 4 | Transport | End-to-end reliability (TCP) or speed (UDP) |
| 3 | Network | Routing and addressing (IP) |
| 2 | Data Link | Frame transmission between adjacent nodes |
| 1 | Physical | Electrical/optical signal transmission |

Encapsulation: each layer wraps the layer above's PDU with its own header (and optional trailer) when sending; strips its header on receive.

### Wireless Security Risks
Unsecured wireless networks expose: piggybacking, wardriving, evil-twin attacks, wireless sniffing, unauthorized access, shoulder sniffing, SMiShing, Bluejacking, RF jamming. Mitigations: change default passwords, encrypt data, use firewalls and VPN, patch access points, hide SSID, disable access after use.

## Operating Systems

Four OS responsibilities: Processor management, Memory management, Device management, Information management.

| Area | Key Concepts |
|---|---|
| Process scheduling | FCFS, SJF, SRTF, Priority, Round Robin |
| Deadlock | Prevention, avoidance, detection, recovery; precedence graphs |
| IPC | Messages, pipes, shared memory, semaphores, mutex locks |
| Memory | Paging, segmentation, virtual memory, demand paging, page replacement (FIFO, LRU, LFU) |
| Memory fragmentation | Internal (fixed partitions) and external (variable partitions); defragmentation |

## AI and Machine Learning

### Learning Type Selection

| Type | Training Data | Use When |
|---|---|---|
| Supervised | Labeled | Classification, regression; sufficient labeled data available |
| Unsupervised | None | Pattern discovery, clustering; no labels available |
| Semi-supervised | Partially labeled | Labeled data is scarce but expensive to produce |
| Reinforcement | Reward signal | Sequential decision-making; no static dataset |

Key ML models: Linear/Logistic Regression, Neural Networks, Decision Trees, Naive Bayes, SVM, Random Forest.

SE for AI vs. AI for SE:
- **AI for SE**: defect prediction, test generation, vulnerability analysis, process assessment — apply with awareness of stochastic behavior and dataset requirements
- **SE for AI**: interdisciplinary teams, evolving-dataset engineering, ethics and equity requirements, ML design patterns

## Decision Checklist

**Must Do**
- [ ] Justify every algorithm choice against expected production data volume using Big-O
- [ ] Require profiling evidence before accepting O(n²) on any user-scaled data path
- [ ] Select data structure based on dominant access pattern (keyed lookup → hash, ordered range → B-tree, priority → heap)
- [ ] Normalize new schemas to 3NF or BCNF by default
- [ ] Document denormalization rationale with performance measurement
- [ ] Choose ACID for any money-movement or audit-trail workload
- [ ] Specify columns explicitly in every production SQL query (no \`SELECT *\`)
- [ ] Include \`WHERE\` clause on every \`UPDATE\` / \`DELETE\` unless full-table is verified intent
- [ ] Validate all inputs from network sources; encrypt all network-facing channels

**Must Not Do**
- [ ] Use O(n²) or worse on unbounded data without profiling evidence
- [ ] Choose a data structure by habit rather than access pattern
- [ ] Leave tables un-normalized without documented rationale
- [ ] Use BASE/NoSQL for workloads requiring strong transactional consistency
- [ ] Use \`SELECT *\` in production queries
- [ ] Run \`DELETE\` or \`UPDATE\` without a \`WHERE\` clause in production code
- [ ] Use long if/switch chains discriminating on type — use polymorphism instead
- [ ] Expose class internals through public APIs (encapsulation violation)

## Anti-Patterns

| Anti-Pattern | Consequence |
|---|---|
| O(n²) on unbounded data without profiling | Performance cliff; system unusable at production scale |
| Loop-in-loop over DB result sets | Effective O(n²) from linear code; N+1 query problem |
| Un-normalized tables | Update anomalies, data inconsistency, redundancy |
| Denormalization without documented rationale | Inconsistency risk with no paper trail |
| \`SELECT *\` in production code | Fragile to schema changes; transfers unnecessary data |
| \`DELETE\`/\`UPDATE\` without \`WHERE\` | Accidental full-table destruction |
| Using BASE/NoSQL for financial consistency | Data loss or inconsistency under partition |
| Hardcoded credentials or connection strings | Credentials exposed in source control |
| Exposing internal representation via public API | Encapsulation violation; change ripples across callers |
| Long if/switch on type discriminator | Violates Open/Closed; each new type requires edit here |

## Standards Referenced

- SWEBOK v4 Ch 16 (all sections)
- ISO/IEC JTC 1/SC 22 — programming language standards
- SEI CERT — coding standards (82% of vulnerabilities from style clashes)
- MISRA — embedded/safety-critical coding standards
- ANSI/ISO SQL:2019 — SQL standard
- OSI Reference Model (ISO/IEC 7498)
`,
  path: "resources/ch16-computing.md",
  title: "Computing Foundations",
  triggers: [
    "Big-O",
    "data-structure",
    "normalization",
    "ACID",
    "OOP",
    "algorithm",
    "SQL",
    "complexity"
  ] as const
};
