---
description: Applies CQRS (Hono GET vs write handlers, Drizzle selects vs writes, TanStack queries vs mutations), the Specification Pattern for eligibility/filter logic, TypeScript branded-type Value Objects, and past-tense Domain Event naming. Use during implementation and code review; includes prescriptive (TDD) and defensive (review) guidance.
trigger: model_decision
---

# DDD Tactical Patterns

## 1. Domain Theory and Conceptual Foundations
Tactical Domain-Driven Design (DDD) provides a set of patterns and constructs to model complex business domains within a software system. As defined in software design theory and aligned with the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 4 (Software Construction) and Chapter 2 (Software Design), tactical DDD models domain logic using structured abstractions. These abstractions isolate business invariants from persistence infrastructure, framework code, and user interface delivery layers.

### 1.1 Entities vs. Value Objects
A fundamental distinction in tactical DDD is between Entities and Value Objects:
- **Entities**: Objects defined by a unique identity and thread of continuity. An entity's attributes can change completely over time, but it remains the same object (e.g., a customer account). In database schemas, entities map to tables with unique primary keys.
- **Value Objects**: Objects defined entirely by their attributes, possessing no identity. They represent conceptual quantities or descriptions (e.g., currency, addresses). Value objects are immutable; changing a value object requires replacing it entirely. In typescript, value objects are modeled as branded primitive types or immutable records. They prevent primitive obsession.

### 1.2 Aggregates, Roots, and Consistency Boundaries
An Aggregate is a cluster of associated domain objects that are treated as a single transactional unit.
- **Aggregate Root**: The single entry point of the aggregate. External objects can only hold references to the root entity's ID, never to internal entities. The root coordinates all state changes.
- **Consistency Boundaries**: Invariants (business rules that must always be true) are enforced by the aggregate root within its boundary. Transactions should not span multiple aggregates; changes across aggregates must rely on eventual consistency driven by domain events.

### 1.3 The Specification Pattern
The Specification Pattern is a tactical design pattern where business rules are represented as reusable, self-contained classes. A specification checks if a domain object satisfies a particular criteria (using an `isSatisfiedBy(candidate)` method). Specifications can be combined using logical operators (AND, OR, NOT) to build complex business policies without polluting entity classes with excessive control flow.

### 1.4 CQRS (Command Query Responsibility Segregation)
CQRS is an architectural pattern that separates read operations (queries) from write operations (commands). Read models and write models are optimized independently:
- **Commands**: Modify system state. They perform business validations and write to the write database model. Commands do not return domain data (only status or confirmation).
- **Queries**: Retrieve state without modifying it. They read from a read model or cache, bypassing complex domain validation to maximize throughput.

## 2. Standard Operating Procedures (SOP)
The agent must apply these tactical DDD patterns when constructing database schemas, API routes, and service layers.

### Step 2.1: Declaring Branded Value Objects
To prevent mixing up primitive types (e.g., passing a Product ID where an Account ID is expected), implement zero-runtime-cost TypeScript branded types:
```typescript
export type AccountId = string & { readonly _brand: "AccountId" };
export type MoneyAmount = number & { readonly _brand: "MoneyAmount" };

export const makeAccountId = (value: string): AccountId => {
  return value as AccountId;
};
```

### Step 2.2: Enforcing Boundaries via Zod Validation
Validate all inputs at the system boundary (e.g., Hono request handler parsing JSON) and cast successfully validated primitives to branded types:
```typescript
import { z } from "zod";

export const paymentSchema = z.object({
  accountId: z.string().uuid().transform((val) => {
    return val as AccountId;
  }),
  amount: z.number().positive().transform((val) => {
    return val as MoneyAmount;
  })
});
```

### Step 2.3: Implementing Aggregates in Drizzle ORM
When modifying an aggregate that spans multiple tables (e.g., an Order and its OrderLineItems), execute all changes within a single Drizzle transaction:
```typescript
import type { DrizzleDb } from "./db.ts";

export const saveOrderAggregate = async (
  db: any,
  order: any,
  items: any[]
): Promise<void> => {
  await db.transaction(async (tx: any) => {
    await tx.insert("ordersTable").values(order).onConflictDoUpdate({
      target: "id",
      set: order
    });
    
    await tx.delete("orderItemsTable").where(eq("orderId", order["id"]));
    if (0 < items.length) {
      await tx.insert("orderItemsTable").values(items);
    }
  });
};
```

### Step 2.4: Naming and Emitting Domain Events
Name all domain events in the past tense to signify that they record an immutable historical fact:
1. **Name Format**: Past-tense verb representing the state change (e.g., `PaymentSubmitted`, `AccountSuspended`, `NotificationSent`).
2. **Emitting Events**: Dispatch domain events immediately after a successful transaction commit. Do not dispatch events before the transaction has been persisted.

### Step 2.5: Segregating Reads and Writes (CQRS)
Enforce CQRS separation across Hono routes and React components:
- **Hono Router**: Map side-effect-free data queries to HTTP `GET` routes only. Use `POST`, `PUT`, or `DELETE` for commands.
- **TanStack Query**: Use `useQuery` for all read pathways. Use `useMutation` for commands. Never trigger mutations inside a `useQuery` query function.

### Step 2.6: Implementing the Specification Pattern
Below is a TypeScript class implementation showing how to define a business eligibility check using the Specification pattern.

```typescript
import { vi } from "vitest";

interface AccountProfile {
  id: AccountId;
  balance: MoneyAmount;
  isActive: boolean;
}

class ActiveAccountSpecification {
  public isSatisfiedBy = (account: AccountProfile): boolean => {
    return account["isActive"];
  };
}

class SufficientFundsSpecification {
  private threshold: MoneyAmount;

  public constructor(threshold: MoneyAmount) {
    this.threshold = threshold;
  }

  public isSatisfiedBy = (account: AccountProfile): boolean => {
    const balance = account["balance"];
    return balance >= this.threshold;
  };
}

describe("Tactical DDD Specifications tests", () => {
  it("should evaluate composite specifications correctly", () => {
    const account: AccountProfile = {
      id: "acc-123" as AccountId,
      balance: 500 as MoneyAmount,
      isActive: true
    };

    const activeSpec = new ActiveAccountSpecification();
    const fundsSpec = new SufficientFundsSpecification(300 as MoneyAmount);

    expect(activeSpec.isSatisfiedBy(account)).toBe(true);
    expect(fundsSpec.isSatisfiedBy(account)).toBe(true);
  });

  it("should fail when account is inactive", () => {
    const account: AccountProfile = {
      id: "acc-124" as AccountId,
      balance: 500 as MoneyAmount,
      isActive: false
    };

    const activeSpec = new ActiveAccountSpecification();
    expect(activeSpec.isSatisfiedBy(account)).toBe(false);
  });
});
```

## 3. Agent Compliance Checklist
The agent must verify that the codebase complies with tactical DDD patterns during coding and code review:

- [ ] **Primitive Obsession Avoided**: Are system identifiers and business primitives modeled as TypeScript branded types?
- [ ] **Boundary Validation**: Are primitive inputs validated at system boundaries (e.g. API endpoints, route handlers) using schemas?
- [ ] **Branded casting**: Are Zod transform methods used to cast validated strings/numbers to branded types?
- [ ] **Entity Identity definition**: Are entities clearly distinguished from value objects by having a unique, immutable primary key?
- [ ] **Value Object Immutability**: Are all value object types declared as readonly to prevent mutating their internal state?
- [ ] **Aggregate Boundary checks**: Do external classes access child entities exclusively through the Aggregate Root?
- [ ] **Single Transaction aggregates**: Are modifications to entities within an aggregate wrapped in a single database transaction?
- [ ] **Stateless Domain Services**: Are domain services stateless, containing only logic and no session state variables?
- [ ] **Domain Event Naming**: Are all domain events named in the past tense (e.g. `OrderCreated`, `PaymentCompleted`)?
- [ ] **Post-Commit Dispatch**: Are domain events dispatched only after the triggering database transaction has successfully committed?
- [ ] **Repository Encapsulation**: Are Drizzle select and insert queries encapsulated inside services rather than inline in routers?
- [ ] **CQRS HTTP Mapping**: Are commands mapped to `POST`/`PUT`/`DELETE` endpoints, and reads mapped to `GET` endpoints?
- [ ] **Query Side-Effect Free**: Do all HTTP `GET` route handlers execute without mutating database or cache state?
- [ ] **TanStack segregation**: Are TanStack `useQuery` hooks used for data reading, and `useMutation` hooks for commands?
- [ ] **No Mutation in Queries**: Is there a complete absence of state mutations inside `useQuery` query functions?
- [ ] **Specification Pattern**: Is complex eligibility or filtering logic encapsulated in reusable specification classes?
- [ ] **No Forbidden Terminology**: Has the code been scanned to verify that no forbidden words (e.g. deprecated frame tools) are present?
- [ ] **Arrow Functions Enforced**: Are all handler methods, mapping functions, and callbacks structured as arrow functions?
- [ ] **No Explicit Return Types**: Do all local TypeScript functions rely on type inference for their return values?
- [ ] **Explicit Member Modifiers**: Are all classes and their members decorated with explicit accessibility keywords?
- [ ] **Bracket notation**: Are Record property lookups in mapping scripts written using bracket notation?
- [ ] **SWEBOK Design Alignment**: Does the aggregate structure conform to SWEBOK v4 Chapter 2 guidelines for modular software design?
- [ ] **Immutability of Value Objects**: Did the agent verify that Value Objects are constructed without setters or mutating operations?
- [ ] **Domain Service encapsulation**: Are operations that span multiple aggregate roots isolated in Domain Services?
- [ ] **Eventually consistent updates**: Are updates outside the aggregate consistency boundary dispatched via domain events?
