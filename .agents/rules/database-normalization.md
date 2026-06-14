---
description: database normalization, relational schema design, 3NF, constraints, and indexes
trigger: model_decision
---

# Database Normalization

## 1. Domain Theory and Conceptual Foundations
Database normalization is a systematic, mathematical process used to design relational database schemas to eliminate data redundancy and prevent data anomalies (insertion, update, and deletion anomalies). As detailed in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 15 (Engineering Foundations) and Chapter 11 (Software Models and Methods), relational schemas should be constructed based on functional dependencies to ensure data integrity and referential correctness at the persistence layer.

### 1.1 Functional Dependencies and Anomalies
A functional dependency $X 	o Y$ exists between two sets of attributes $X$ and $Y$ in a relation if and only if each $X$-value is associated with exactly one $Y$-value. Functional dependencies dictate the normal form of a schema. If functional dependencies are neglected, databases suffer from three types of anomalies:
1. **Insertion Anomaly**: Inability to insert certain data without the presence of other data (e.g. cannot add a new course unless at least one student enrolls in it).
2. **Update Anomaly**: Redundant data leads to inconsistent state updates if a value is changed in one row but not in others (e.g., updating a student's address in one course enrollment row but leaving their old address in another course enrollment row).
3. **Deletion Anomaly**: Deleting a row unintentionally destroys unrelated data (e.g. deleting the last student enrolled in a course deletes all information about that course).

### 1.2 Normal Forms: 1NF to BCNF and Higher Forms
Normalization progresses through progressive stages called Normal Forms:
- **First Normal Form (1NF)**: A relation is in 1NF if and only if the domain of each attribute contains only atomic (indivisible) values, and there are no repeating groups or multi-valued attributes.
- **Second Normal Form (2NF)**: A relation is in 2NF if it is in 1NF and every non-prime attribute is fully functionally dependent on the entire primary key. This means no partial dependencies exist (i.e. no non-prime attribute depends on a proper subset of a composite primary key).
- **Third Normal Form (3NF)**: A relation is in 3NF if it is in 2NF and no non-prime attribute is transitively dependent on the primary key. Mathematically, for any functional dependency $X 	o Y$, either:
  - $X$ is a superkey, or
  - $Y$ is a prime attribute (part of a candidate key).
- **Boyce-Codd Normal Form (BCNF)**: A stronger version of 3NF. A relation is in BCNF if and only if for every non-trivial functional dependency $X 	o Y$, $X$ is a superkey. BCNF resolves anomalies caused by overlapping composite candidate keys.
- **Fourth Normal Form (4NF)**: Deals with multi-valued dependencies (MVDs), represented as $X 	woheadrightarrow Y$. A relation is in 4NF if, for every non-trivial MVD $X 	woheadrightarrow Y$, $X$ is a superkey. This prevents independent multi-valued facts about an entity from being stored in the same table.
- **Fifth Normal Form (5NF)**: Deals with join dependencies. A relation is in 5NF (or Project-Join Normal Form) if and only if every join dependency in it is implied by its candidate keys. This ensures that the relation cannot be decomposed into smaller relations that, when joined, yield spurious rows or lose information.

### 1.3 Denormalization and Performance Trade-offs
While normalization guarantees consistency, highly normalized schemas require complex multi-table joins that can degrade read performance. **Denormalization** is the intentional, controlled introduction of redundancy to optimize query performance.
- **Pre-Joining Tables**: Storing a parent table's attribute directly in the child table to avoid dynamic JOIN operations.
- **Derived / Aggregated Data**: Storing running totals, counts, or averages (e.g., storing `totalPrice` on an `orders` table, rather than summing `order_items` at query time).
- **Partitioning Alternatives**: Before denormalizing, consider horizontal partitioning (sharding) or vertical partitioning (splitting wide tables into narrow ones) to optimize database IO.
- Denormalization must only be done after profiling query performance. Any denormalized fields must be managed using synchronization mechanisms (e.g. application-level hooks or database triggers) to prevent update anomalies.

### 1.4 Referential Integrity and Indexing
- **Constraints**: Relational integrity is enforced using primary keys, foreign keys (with explicit `ON DELETE` and `ON UPDATE` cascading rules), unique constraints, and check constraints.
- **Indexes**: Indexes (typically B-Trees) speed up data retrieval. Primary keys and foreign keys must be indexed. However, because indexes add write overhead (updating the B-Tree on insert/update/delete), indexes must be chosen selectively by analyzing query execution plans (`EXPLAIN`).

## 2. Standard Operating Procedures (SOP)
The agent must design and implement database schemas according to the following procedures:

### Step 2.1: Enforce 3NF Normalization during Schema Design
Before creating any new database tables:
- List all entity attributes and identify candidate keys.
- Enumerate all functional dependencies.
- Verify that the schema is in 3NF.
- **Normalization Example**: Suppose we have an unnormalized order invoice:
  ```
  [OrderID, CustomerID, CustomerName, CustomerAddress, ItemID, ItemPrice, Quantity]
  ```
  1. *Functional Dependencies*:
     - `OrderID -> CustomerID`
     - `CustomerID -> CustomerName, CustomerAddress`
     - `ItemID -> ItemPrice`
     - `(OrderID, ItemID) -> Quantity`
  2. *Transition to 1NF*: All values are atomic.
  3. *Transition to 2NF*: Remove partial dependencies on the composite key `(OrderID, ItemID)`. We extract items:
     - Table 1: `order_items` containing `[OrderID, ItemID, Quantity]`
     - Table 2: `items` containing `[ItemID, ItemPrice]`
     - Table 3: `orders` containing `[OrderID, CustomerID, CustomerName, CustomerAddress]`
  4. *Transition to 3NF*: Remove transitive dependency `OrderID -> CustomerID -> CustomerAddress`. We extract customers:
     - Table 3: `orders` containing `[OrderID, CustomerID]`
     - Table 4: `customers` containing `[CustomerID, CustomerName, CustomerAddress]`

### Step 2.2: Implement Normalized Schemas in Drizzle ORM
When writing table definitions:
- Enforce strict typing on columns.
- Define explicit primary keys, foreign keys, and indexes.
- Do not use index signature properties via dot notation in migrations or queries.
- Align Drizzle column declarations exactly with alphabetical/definition order in tests to prevent D1 mock mismatches.
```typescript
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  role: text("role").notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
}));
```

### Step 2.3: Optimize Query Performance via EXPLAIN plans
- For any slow-running read query, prepend the query with `EXPLAIN` or `EXPLAIN QUERY PLAN` to inspect the execution path.
- Verify if the database is performing a sequential scan (full table scan) on a large table.
- If a sequential scan is found on a frequently queried filter column, add an index to that column in the schema.

### Step 2.4: Execute Verification Commands
- Compile and test the project to ensure Drizzle schemas compile without type errors:
```bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build test
rtk pnpm --filter @ethang/agents-build lint
```

## 3. Agent Compliance Checklist
The agent must verify compliance with the following database normalization rules:

- [ ] **Functional Dependencies Mapped**: Did the agent analyze functional dependencies before creating new tables?
- [ ] **Normalized to 3NF**: Is the persistence schema normalized to at least 3NF, or is denormalization explicitly justified?
- [ ] **Anomalies Analyzed**: Did the agent verify that insertion, update, and deletion anomalies are prevented?
- [ ] **Foreign Keys Defined**: Are foreign keys declared with explicit `ON DELETE` and `ON UPDATE` behaviors?
- [ ] **Foreign Keys Indexed**: Are all foreign key columns configured with database indexes to optimize join queries?
- [ ] **Indexes Selected Carefully**: Are indexes added only on columns used in search filters or join conditions?
- [ ] **Explain Plan Run**: Was `EXPLAIN` executed to verify query optimization for heavy reads?
- [ ] **No Property Access from Index Signature**: Does the code use bracket notation `obj["prop"]` instead of dot notation for index-signature types?
- [ ] **D1 Mock Column Order Aligned**: In mocks, does the column order match the schema definition order exactly?
- [ ] **No Native Dates**: Are date properties persisted as ISO strings or integers and processed using Luxon (`DateTime`)?
- [ ] **Forbidden Words Checked**: Has the rule been scanned to confirm no forbidden enterprise vocabularies are present?
- [ ] **Size Bounds Confirmed**: Is the compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent run verification (build, test, lint) using the `rtk` command prefix?
- [ ] **Walkthrough Updated**: Are schema updates, migration scripts, and index analysis documented in `walkthrough.md`?
- [ ] **Void Assertions Wrapped**: Are unit test cases verifying lack of exceptions wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **Arrow Functions Enforced**: Are all function declarations defined as arrow functions?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest `it.each` tables explicitly typed to prevent compiler resolution mismatches?
- [ ] **Schema Migrations Versioned**: Are SQL migration scripts version-controlled and matching schema changes?
- [ ] **Nullable Fields Restricted**: Are nullable columns restricted only to fields that are optional?
- [ ] **Unique Constraints Configured**: Are business-level uniqueness rules enforced using unique constraints at the database level?
