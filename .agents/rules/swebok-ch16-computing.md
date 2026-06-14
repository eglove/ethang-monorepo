---
description: "Computing Foundations: algorithms, data structures, and operating systems"
trigger: model_decision
---

# Computing Foundations (SWEBOK v4, Chapter 16)

> Scope: computer science concepts a software engineer must command to architect, design, construct, and maintain software — algorithm complexity, data structures, OOP, databases, OS, networking, AI/ML. Theory lives here; stack-specific design checks live in the review-design-checklist.

## When to Apply

- Selecting or justifying an algorithm given expected data volume (Big-O review).
- Choosing a data structure for a new feature (access pattern analysis).
- Designing or reviewing a database schema (normalization, ACID vs BASE).
- Evaluating distributed vs. parallel approach for a service.
- Reviewing OOP class design for encapsulation, inheritance, and polymorphism correctness.

## Key Definitions

- **Big-O / O(f(n))**: Upper bound on worst-case resource consumption as input size grows.
- **ADT**: Abstract Data Type defined by behavior (operations), not implementation.
- **Normalization**: Organizing relational data to eliminate redundancy and update anomalies.
- **ACID**: Atomicity, Consistency, Isolation, Durability transaction guarantees.
- **BASE**: Basically Available, Soft state, Eventually consistent NoSQL model.
- **ISA**: Instruction Set Architecture (abstract CPU execution model).
- **IPC**: Inter-Process Communication (pipes, shared memory, mutexes).
- **HCI**: Human-Computer Interface design discipline.
- **OSI**: Open Systems Interconnection 7-layer reference model.

## Algorithm Complexity

### Asymptotic Notations
- **O(f(n))**: Upper bound (worst case).
- **Ω(f(n))**: Lower bound (best case).
- **Θ(f(n))**: Tight bound (average case).
- **o(f(n))** / **ω(f(n))**: Non-tight bounds.

### Complexity Classes and Review Thresholds
- **Constant / Logarithmic / Linear**: O(1), O(log n), O(n). Always acceptable.
- **Log-linear**: O(n log n). Preferred for sorts.
- **Quadratic**: O(n²). Acceptable for n ≤ ~10,000 with profiling. Avoid on unbounded datasets or loop-in-loop on DB result sets.
- **Cubic / Exponential**: O(n³), O(2ⁿ), O(n!). Avoid in production paths; profiling required.

Rule: Algorithm choices must be justified against expected production data volume. Profiling evidence is required before accepting O(n²) or worse on paths scaling with user data.

### Algorithm Design Strategies
- **Divide & Conquer**: Recursive decomposition (merge sort, binary search).
- **Dynamic Programming**: Overlapping subproblems with optimal substructure.
- **Greedy**: Local optimum leads to global optimum (Huffman coding).
- **Backtracking**: Constraint satisfaction; prune invalid paths early.
- **Brute Force**: Only for tiny fixed inputs; never on user-scaled data.

Iterative is preferred over recursive for performance; use recursion only when naturally recursive (tree traversal).

## Data Structure Selection
Match structure to access pattern:
- **Keyed lookup**: Hash Map / Hash Table (O(1) average).
- **Ordered traversal / range query**: BST, AVL Tree (O(log n)).
- **Ordered range on disk / index**: B-Tree, B+ Tree (O(log n)).
- **Frequent insert/delete with ordered access**: Red-Black Tree (O(log n)).
- **LIFO / FIFO**: Stack / Queue (O(1)).
- **Priority ordering**: Heap / Priority Queue (O(log n)).
- **Hierarchical**: Tree.
- **Shortest paths / relationships**: Graph.
- **Sequential indexed access**: Array (O(1)).

Operations: CRUD, sorts (Quick, Merge, Heap), searches (Linear, Binary, Hash). Collision resolution: linear/quadratic probing, separate chaining.

## Object-Oriented Programming
- **Abstraction**: Expose interface; hide implementation details.
- **Encapsulation**: Bundle data + methods; control access. No public mutable fields.
- **Inheritance**: Subclass inherits superclass. Liskov Substitution must hold.
- **Polymorphism**: Single interface, multiple implementations. Avoid long type-discrimination switch chains.

## Database Management

### Database Selection
- **Relational (RDBMS)**: Structured data, complex joins, strong consistency (ACID). Default choice.
- **NoSQL**: Document, key-value, column-family (BASE). Use for high write volume or horizontal scaling.
- **Graph DB**: Highly connected data.
- **Time Series DB**: Sensor/metric/log data.

### ACID vs BASE
- **ACID**: Atomicity, Consistency, Isolation, Durability. Strong consistency. Finance, audits, money.
- **BASE**: Basically Available, Soft state, Eventually consistent. High-volume reads, session stores.

### Normalization Decision Rules
- **1NF**: Repeating groups, non-atomic values (Always apply).
- **2NF**: Partial key dependency.
- **3NF**: Transitive dependency (Default target).
- **BCNF**: Functional dependencies not from superkey (Apply when 3NF anomalies remain).
- **De-normalize**: Intentionally add redundancy only with documented query-performance measurements.

### SQL Rules
- Specify columns explicitly (avoid `SELECT *` in production).
- Include a `WHERE` clause in all `UPDATE` and `DELETE` statements unless full-table is intended.

## Computer Networks
- **OSI 7-Layer Model**: Application (HTTP/DNS) → Presentation → Session → Transport (TCP/UDP) → Network (IP) → Data Link → Physical.
- **Encapsulation**: Wrap higher layer's PDU with headers/trailers when sending; strip on receive.
- **Wireless Risks**: Sniffing, wardriving, evil-twin, SMiShing. Mitigations: VPN, encryption, firewalls.

## Operating Systems
- **OS Roles**: Processor, Memory, Device, and Information management.
- **Scheduling**: FCFS, SJF, SRTF, Priority, Round Robin.
- **Deadlock**: Prevention, avoidance, detection, recovery.
- **IPC**: Pipes, shared memory, semaphores, mutex locks.
- **Memory**: Paging, segmentation, virtual memory, replacement (FIFO, LRU). Fragmentation: internal vs external.

## AI and Machine Learning
- **Learning Types**: Supervised (labeled; classification/regression), Unsupervised (none; clustering), Semi-supervised (partially labeled), Reinforcement (reward signal).
- **SE for AI**: Evolving datasets, ethics/equity, ML design patterns.
- **AI for SE**: Defect prediction, test generation.

## Decision Checklist

Must Do:
- Justify algorithm choices against expected production data volume using Big-O.
- Require profiling evidence before accepting O(n²) on user-scaled paths.
- Match data structures to dominant access patterns.
- Normalize schemas to 3NF or BCNF by default.
- Document denormalization with query performance measurements.
- Use ACID for financial or audit workloads.
- Specify columns explicitly in production SQL queries.
- Use a `WHERE` clause on all SQL update/deletes.
- Validate network inputs; encrypt network channels.

Must Not Do:
- Use O(n²) or worse on scaling data without profiling.
- Choose data structures by habit rather than access pattern.
- Leave tables un-normalized without documented rationale.
- Use BASE for strong transaction consistency.
- Use `SELECT *` in production queries.
- Run delete or updates without a `WHERE` clause.
- Use switch/if chains on type discriminators (use polymorphism).
- Expose class internals via public APIs.

## Anti-Patterns
- **O(n²) on unbounded data**: Performance cliff at scale.
- **Loop-in-loop over DB queries**: N+1 query problem.
- **Un-normalized tables**: Update anomalies, redundancy.
- **SELECT * in production**: Fragile to schema changes, transfers unnecessary data.
- **DELETE/UPDATE without WHERE**: Accidental full-table destruction.
- **BASE for financial consistency**: Inconsistency or data loss.
- **Exposing internal representation**: Violates encapsulation.
- **Long if/switch on type discriminator**: Violates Open/Closed.

## Standards Referenced
- **OSI Reference Model** (ISO/IEC 7498).
- **ANSI/ISO SQL**.
- **SEI CERT** / **MISRA** coding standards.
