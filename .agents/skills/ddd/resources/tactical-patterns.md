# Tactical Domain-Driven Design

Tactical Domain-Driven Design (DDD) provides concrete coding patterns and building blocks to implement a rich domain model inside a bounded context.

---

## 1. Entities vs. Value Objects

A domain model is composed of two primary object types: Entities and Value Objects.

| Characteristic | Entity | Value Object |
|---|---|---|
| **Identity** | Unique identifier (e.g., UUID, database ID). | No identity. Defined entirely by its attributes. |
| **Lifecycle** | Mutable. Changes state over time while remaining the same object. | Immutable. To modify a Value Object, replace it completely. |
| **Equality** | Evaluated by comparing identifiers. | Evaluated by comparing all attributes (structural equality). |
| **Validation** | Guarantees internal state invariants. | Guarantees validity at creation; invalid objects cannot exist. |

### TypeScript Example: Value Object vs. Entity

```typescript
// Base Value Object class providing structural equality check
export abstract class ValueObject<T> {
  protected abstract getEqualityComponents(): unknown[];

  public equals = (other: ValueObject<T> | null | undefined): boolean => {
    if (null === other || undefined === other) {
      return false;
    }
    const thisComponents = this.getEqualityComponents();
    const otherComponents = other.getEqualityComponents();
    return thisComponents.every((component, index) => {
      return component === otherComponents[index];
    });
  };
}

// Immutable Money Value Object
export class Money extends ValueObject<Money> {
  private readonly _amount: number;
  private readonly _currency: string;

  private constructor(amount: number, currency: string) {
    super();
    this._amount = amount;
    this._currency = currency;
  }

  public static create = (amount: number, currency: string): Money => {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }
    if ("" === currency.trim()) {
      throw new Error("Currency is required");
    }
    return new Money(amount, currency.toUpperCase());
  };

  public get amount(): number {
    return this._amount;
  }

  public get currency(): string {
    return this._currency;
  }

  protected getEqualityComponents = (): unknown[] => {
    return [this._amount, this._currency];
  };
}
```

---

## 2. Anemic vs. Rich Domain Models

- **Anemic Domain Model**: A database-centric model where entities are simple property bags with public getters and setters (e.g., `dto-like` classes). All business rules and behaviors are scattered across external services or controllers. This increases technical debt and creates consistency issues.
- **Rich Domain Model**: A behavior-driven model where entities encapsulate both data and the operations allowed on that data. Setters are private/protected, and state transitions occur only through explicit domain methods that enforce invariants.

### TypeScript Example: Rich Entity

```typescript
export class Employee {
  public readonly id: string;
  private _salary: Money;
  private _assignments: string[]; // Store IDs

  public constructor(id: string, salary: Money, assignments: string[]) {
    this.id = id;
    this._salary = salary;
    this._assignments = assignments;
  }

  // Setters are read-only from the outside, encapsulated behavior methods are exposed
  public get salary(): Money {
    return this._salary;
  }

  public get assignments(): readonly string[] {
    return this._assignments;
  }

  // Encapsulated Domain Behavior with validation rules
  public updateSalary = (newSalary: Money): void => {
    if (newSalary.currency !== this._salary.currency) {
      throw new Error("Cannot change salary currency directly");
    }
    if (newSalary.amount < this._salary.amount * 0.9) {
      throw new Error("Salary reduction cannot exceed 10%");
    }
    this._salary = newSalary;
  };

  public assignToStore = (storeId: string): void => {
    if (this._assignments.includes(storeId)) {
      throw new Error("Employee is already assigned to this store");
    }
    if (this._assignments.length >= 2) {
      throw new Error("Employee cannot be assigned to more than 2 stores concurrently");
    }
    this._assignments.push(storeId);
  };
}
```

---

## 3. Aggregates and Aggregate Roots

An **Aggregate** is a cluster of associated entities and value objects that are treated as a single unit for data changes.

### 3.1 Consistency and Transactional Boundaries
- **Aggregate Root**: The main entity in the aggregate through which all external interactions must flow. External objects can only hold references to the Aggregate Root.
- **Invariants**: Business rules that must remain consistent at the end of every transaction. The Aggregate Root is responsible for guarding these invariants.
- **Transactional Boundary**: An aggregate is persisted as a single unit. Changes to child entities within the aggregate are updated or rolled back together.

---

## 4. Domain Services

A **Domain Service** is a stateless class that encapsulates business logic that does not naturally belong to a single entity or aggregate root, particularly operations that:
- Coordinate tasks across multiple different aggregate roots.
- Interact with external infrastructure (e.g., third-party identity providers, legacy systems) through interfaces.

*Note: Domain services are purely algorithmic and coordinate aggregates by reference (usually by ID) to respect aggregate boundaries.*

### TypeScript Example: Domain Service

```typescript
export class StoreAssignmentService {
  private readonly employeeRepository: EmployeeRepository;
  private readonly storeRepository: StoreRepository;

  public constructor(employeeRepository: EmployeeRepository, storeRepository: StoreRepository) {
    this.employeeRepository = employeeRepository;
    this.storeRepository = storeRepository;
  }

  public executeStoreAssignment = async (employeeId: string, storeId: string): Promise<void> => {
    const employee = await this.employeeRepository.findById(employeeId);
    const store = await this.storeRepository.findById(storeId);

    if (null === employee || null === store) {
      throw new Error("Employee or Store not found");
    }

    if (!store.isActive) {
      throw new Error("Cannot assign employee to an inactive store");
    }

    // Delegate behavior check to aggregate root
    employee.assignToStore(store.id);

    await this.employeeRepository.save(employee);
  };
}
```
