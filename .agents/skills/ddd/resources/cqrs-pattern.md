# Command Query Responsibility Segregation (CQRS)

Command Query Responsibility Segregation (CQRS) separates data reads (Queries) from data writes (Commands) across the entire architecture.

---

## 1. CQS vs. CQRS

- **CQS (Command-Query Separation)**: A method-level design principle. A method should either change the state of the system (Command) or return data (Query), but never both.
  - *Command*: Alters state, returns success/error status or generated ID. Has side effects.
  - *Query*: Read-only, returns data, has no side effects, and is safe to run repeatedly.
- **CQRS**: An architectural-level design pattern. It segregates read operations from write operations across different classes, models, handlers, and sometimes physical databases.

---

## 2. Refactoring CRUD to a Task-Based UI

Traditional CRUD interfaces expose full records for bulk edits (e.g., a single `Edit Employee` form containing salary, address, personal details, and roles). This makes validation difficult, increases the risk of overriding unrelated data, and fails to reflect user intent.

A **Task-Based UI** models specific business tasks as distinct operations. It guides the user through isolated workflows (e.g., `Give Raise`, `Assign Role`, `Update Address`). This allows:
- Context-specific validations (e.g., salary raise can only be positive).
- Precise user intent logging.
- Loose coupling between different domain functionalities.

---

## 3. Command and Query Handlers with a Mediator

Rather than controllers holding direct references to services, repositories, or SQL context, the presentation layer sends a Command or Query object to a central Mediator. The Mediator routes the intent to its registered handler.

```
┌──────────────┐          Command / Query          ┌──────────┐          Routes to          ┌─────────────────┐
│  Controller  ├──────────────────────────────────>│ Mediator ├────────────────────────────>│ Command / Query │
│ (Endpoints)  │                                   │          │                             │     Handler     │
└──────────────┘                                   └──────────┘                             └─────────────────┘
```

### TypeScript Example: Command, Query, and Mediator

```typescript
// Core types
export interface Request<TResponse> {
  readonly _responseType?: TResponse;
}

export interface RequestHandler<TRequest extends Request<TResponse>, TResponse> {
  handle: (request: TRequest) => Promise<TResponse>;
}

// Simple Mediator Implementation
export class Mediator {
  private handlers = new Map<string, unknown>();

  public register = <TRequest extends Request<TResponse>, TResponse>(
    requestName: string,
    handler: RequestHandler<TRequest, TResponse>
  ): void => {
    this.handlers.set(requestName, handler);
  };

  public send = async <TResponse>(request: Request<TResponse>): Promise<TResponse> => {
    const key = request.constructor.name;
    const handler = this.handlers.get(key) as RequestHandler<Request<TResponse>, TResponse> | undefined;

    if (undefined === handler) {
      throw new Error(`No handler registered for request ${key}`);
    }

    return handler.handle(request);
  };
}
```

#### 3.1 Write Side (Command): Hire Employee
```typescript
// application/commands/HireEmployeeCommand.ts
import { Request } from "../Mediator.ts";

export class HireEmployeeCommand implements Request<string> {
  public readonly name: string;
  public readonly salaryAmount: number;

  public constructor(name: string, salaryAmount: number) {
    this.name = name;
    this.salaryAmount = salaryAmount;
  }
}

// application/commands/HireEmployeeCommandHandler.ts
import { HireEmployeeCommand } from "./HireEmployeeCommand.ts";
import { RequestHandler } from "../Mediator.ts";
import { EmployeeRepository } from "../../domain/EmployeeRepository.ts";
import { Employee } from "../../domain/Employee.ts";
import { Money } from "../../domain/Money.ts";

export class HireEmployeeCommandHandler implements RequestHandler<HireEmployeeCommand, string> {
  private readonly repository: EmployeeRepository;

  public constructor(repository: EmployeeRepository) {
    this.repository = repository;
  }

  public handle = async (command: HireEmployeeCommand): Promise<string> => {
    const id = crypto.randomUUID();
    const money = Money.create(command.salaryAmount, "USD");
    const employee = new Employee(id, money);

    await this.repository.save(employee);
    return id; // Returns only the identifier of the created resource
  };
}
```

#### 3.2 Read Side (Query): Get Employee View Model
```typescript
// application/queries/GetEmployeeByIdQuery.ts
import { Request } from "../Mediator.ts";
import { EmployeeReadModel } from "./EmployeeReadModel.ts";

export class GetEmployeeByIdQuery implements Request<EmployeeReadModel> {
  public readonly id: string;

  public constructor(id: string) {
    this.id = id;
  }
}

// application/queries/GetEmployeeByIdQueryHandler.ts
import { GetEmployeeByIdQuery } from "./GetEmployeeByIdQuery.ts";
import { RequestHandler } from "../Mediator.ts";
import { EmployeeReadModel } from "./EmployeeReadModel.ts";

export class GetEmployeeByIdQueryHandler implements RequestHandler<GetEmployeeByIdQuery, EmployeeReadModel> {
  private readonly dbClient: DatabaseClient;

  public constructor(dbClient: DatabaseClient) {
    this.dbClient = dbClient;
  }

  public handle = async (query: GetEmployeeByIdQuery): Promise<EmployeeReadModel> => {
    // Queries bypass the domain aggregates completely for high performance
    const row = await this.dbClient.query(
      "SELECT id, name, salary_amount FROM employees WHERE id = $1 LIMIT 1",
      [query.id]
    );

    if (0 === row.length) {
      throw new Error(`Employee ${query.id} not found`);
    }

    return {
      id: row[0]["id"],
      fullName: row[0]["name"],
      formattedSalary: `$${row[0]["salary_amount"]}`
    };
  };
}
```

---

## 4. Segregating Write and Read Models

By segregating Write and Read models:
- **Write Models (Aggregates)**: Optimized for transaction consistency, business rule checking, and data isolation. They do not expose getters or properties that allow external mutation.
- **Read Models (DTOs)**: Optimized for presentation requirements, containing pre-formatted fields, aggregated statistics, and denormalized views. They bypass domain logic and use direct SQL database queries.
