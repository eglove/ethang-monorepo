import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const tacticalPatterns = [
  {
    level: 1,
    text: "Tactical Domain-Driven Design",
    type: "header"
  },
  {
    text: "Tactical Domain-Driven Design (DDD) provides concrete coding patterns and building blocks to implement a rich domain model inside a bounded context.",
    type: "text"
  },
  {
    level: 2,
    text: "1. Entities vs. Value Objects",
    type: "header"
  },
  {
    text: "A domain model is composed of two primary object types: Entities and Value Objects.",
    type: "text"
  },
  {
    headers: ["Characteristic", "Entity", "Value Object"],
    rows: [
      [
        "**Identity**",
        "Unique identifier (e.g., UUID, database ID).",
        "No identity. Defined entirely by its attributes."
      ],
      [
        "**Lifecycle**",
        "Mutable. Changes state over time while remaining the same object.",
        "Immutable. To modify a Value Object, replace it completely."
      ],
      [
        "**Equality**",
        "Evaluated by comparing identifiers.",
        "Evaluated by comparing all attributes (structural equality)."
      ],
      [
        "**Validation**",
        "Guarantees internal state invariants.",
        "Guarantees validity at creation; invalid objects cannot exist."
      ]
    ],
    type: "table"
  },
  {
    level: 3,
    text: "TypeScript Example: Value Object vs. Entity",
    type: "header"
  },
  {
    code: '// Base Value Object class providing structural equality check\nexport abstract class ValueObject<T> {\n  protected abstract getEqualityComponents(): unknown[];\n\n  public equals = (other: ValueObject<T> | null | undefined): boolean => {\n    if (null === other || undefined === other) {\n      return false;\n    }\n    const thisComponents = this.getEqualityComponents();\n    const otherComponents = other.getEqualityComponents();\n    return thisComponents.every((component, index) => {\n      return component === otherComponents[index];\n    });\n  };\n}\n\n// Immutable Money Value Object\nexport class Money extends ValueObject<Money> {\n  private readonly _amount: number;\n  private readonly _currency: string;\n\n  private constructor(amount: number, currency: string) {\n    super();\n    this._amount = amount;\n    this._currency = currency;\n  }\n\n  public static create = (amount: number, currency: string): Money => {\n    if (amount < 0) {\n      throw new Error("Amount cannot be negative");\n    }\n    if ("" === currency.trim()) {\n      throw new Error("Currency is required");\n    }\n    return new Money(amount, currency.toUpperCase());\n  };\n\n  public get amount(): number {\n    return this._amount;\n  }\n\n  public get currency(): string {\n    return this._currency;\n  }\n\n  protected getEqualityComponents = (): unknown[] => {\n    return [this._amount, this._currency];\n  };\n}',
    language: "typescript",
    type: "codeBlock"
  },
  {
    level: 2,
    text: "2. Anemic vs. Rich Domain Models",
    type: "header"
  },
  {
    items: [
      {
        text: "**Anemic Domain Model**: A database-centric model where entities are simple property bags with public getters and setters (e.g., `dto-like` classes). All business rules and behaviors are scattered across external services or controllers. This increases technical debt and creates consistency issues."
      },
      {
        text: "**Rich Domain Model**: A behavior-driven model where entities encapsulate both data and the operations allowed on that data. Setters are private/protected, and state transitions occur only through explicit domain methods that enforce invariants."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "TypeScript Example: Rich Entity",
    type: "header"
  },
  {
    code: 'export class Employee {\n  public readonly id: string;\n  private _salary: Money;\n  private _assignments: string[]; // Store IDs\n\n  public constructor(id: string, salary: Money, assignments: string[]) {\n    this.id = id;\n    this._salary = salary;\n    this._assignments = assignments;\n  }\n\n  // Setters are read-only from the outside, encapsulated behavior methods are exposed\n  public get salary(): Money {\n    return this._salary;\n  }\n\n  public get assignments(): readonly string[] {\n    return this._assignments;\n  }\n\n  // Encapsulated Domain Behavior with validation rules\n  public updateSalary = (newSalary: Money): void => {\n    if (newSalary.currency !== this._salary.currency) {\n      throw new Error("Cannot change salary currency directly");\n    }\n    if (newSalary.amount < this._salary.amount * 0.9) {\n      throw new Error("Salary reduction cannot exceed 10%");\n    }\n    this._salary = newSalary;\n  };\n\n  public assignToStore = (storeId: string): void => {\n    if (this._assignments.includes(storeId)) {\n      throw new Error("Employee is already assigned to this store");\n    }\n    if (this._assignments.length >= 2) {\n      throw new Error("Employee cannot be assigned to more than 2 stores concurrently");\n    }\n    this._assignments.push(storeId);\n  };\n}',
    language: "typescript",
    type: "codeBlock"
  },
  {
    level: 2,
    text: "3. Aggregates and Aggregate Roots",
    type: "header"
  },
  {
    text: "An **Aggregate** is a cluster of associated entities and value objects that are treated as a single unit for data changes.",
    type: "text"
  },
  {
    level: 3,
    text: "3.1 Consistency and Transactional Boundaries",
    type: "header"
  },
  {
    items: [
      {
        text: "**Aggregate Root**: The main entity in the aggregate through which all external interactions must flow. External objects can only hold references to the Aggregate Root."
      },
      {
        text: "**Invariants**: Business rules that must remain consistent at the end of every transaction. The Aggregate Root is responsible for guarding these invariants."
      },
      {
        text: "**Transactional Boundary**: An aggregate is persisted as a single unit. Changes to child entities within the aggregate are updated or rolled back together."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "4. Domain Services",
    type: "header"
  },
  {
    text: "A **Domain Service** is a stateless class that encapsulates business logic that does not naturally belong to a single entity or aggregate root, particularly operations that:",
    type: "text"
  },
  {
    items: [
      {
        text: "Coordinate tasks across multiple different aggregate roots."
      },
      {
        text: "Interact with external infrastructure (e.g., third-party identity providers, legacy systems) through interfaces."
      }
    ],
    type: "unorderedList"
  },
  {
    text: "*Note: Domain services are purely algorithmic and coordinate aggregates by reference (usually by ID) to respect aggregate boundaries.*",
    type: "text"
  },
  {
    level: 3,
    text: "TypeScript Example: Domain Service",
    type: "header"
  },
  {
    code: 'export class StoreAssignmentService {\n  private readonly employeeRepository: EmployeeRepository;\n  private readonly storeRepository: StoreRepository;\n\n  public constructor(employeeRepository: EmployeeRepository, storeRepository: StoreRepository) {\n    this.employeeRepository = employeeRepository;\n    this.storeRepository = storeRepository;\n  }\n\n  public executeStoreAssignment = async (employeeId: string, storeId: string): Promise<void> => {\n    const employee = await this.employeeRepository.findById(employeeId);\n    const store = await this.storeRepository.findById(storeId);\n\n    if (null === employee || null === store) {\n      throw new Error("Employee or Store not found");\n    }\n\n    if (!store.isActive) {\n      throw new Error("Cannot assign employee to an inactive store");\n    }\n\n    // Delegate behavior check to aggregate root\n    employee.assignToStore(store.id);\n\n    await this.employeeRepository.save(employee);\n  };\n}',
    language: "typescript",
    type: "codeBlock"
  }
] as MarkdownBlock[];
