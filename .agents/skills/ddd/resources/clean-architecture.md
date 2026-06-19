# Clean Architecture and Separation of Layers

Clean Architecture separates business rules from frameworks, databases, user interfaces, and external systems. It ensures the codebase remains testable, maintainable, and independent of technological volatility.

---

## 1. The Four Layers of Clean Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                     │
│               (Controllers, Routes, Endpoints)              │
└──────────────────────────────┬──────────────────────────────┘
                               │ (calls)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                      │
│             (Use Cases, DTOs, Handlers, Mediators)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ (orchestrates)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Domain Layer                         │
│             (Entities, Value Objects, Aggregates)           │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │ (interfaces implemented by)
┌──────────────────────────────┴──────────────────────────────┐
│                     Infrastructure Layer                    │
│             (Databases, ORMs, HTTP clients, Buses)          │
└──────────────────────────────┴──────────────────────────────┘
```

### 1.1 Presentation Layer
- **Role**: The entry point of the system (API endpoints, controllers, serverless handlers).
- **Responsibilities**:
  - Handles incoming network requests, parses payloads, and validates basic HTTP parameters.
  - Binds incoming requests to Data Transfer Objects (DTOs).
  - Delegates the execution of the request to the application layer.
  - Serializes response data (e.g., as JSON, HTML) and returns the HTTP status.

### 1.2 Application Layer
- **Role**: Orchestrates the workflows of the system's use cases.
- **Responsibilities**:
  - Defines the operational steps for specific tasks (e.g., "Hire Employee", "Finalize Order").
  - Retrieves domain aggregates from repositories (defined as interfaces).
  - Invokes domain model behaviors or domain services.
  - Persists changes back through repository interfaces.
  - Formulates command responses or view models to return to the presentation layer.

### 1.3 Domain Layer
- **Role**: Contains the pure business rules, logic, and state validations of the business.
- **Responsibilities**:
  - Encapsulates entities, value objects, and aggregates.
  - Implements core algorithmic domain services.
  - **No dependencies**: The domain layer must not import classes, packages, or annotations from the presentation, application, or infrastructure layers.

### 1.4 Infrastructure Layer
- **Role**: Implements technical details, databases, file systems, and network communication.
- **Responsibilities**:
  - Implements database adapters and repositories using ORMs (e.g., Prisma, Drizzle).
  - Manages database transactions and connection strings.
  - Integrates third-party services, queues, and message buses (e.g., RabbitMQ, Kafka, WebSockets).

---

## 2. Inward-Flowing Dependency Rule

Dependencies must flow inward only:
- Code in the **Domain** layer cannot depend on any other layer.
- Code in the **Application** layer can only depend on the **Domain** layer. It interacts with the Infrastructure layer *only* via interfaces (e.g., repository interfaces).
- Code in the **Infrastructure** and **Presentation** layers can depend on the **Application** and **Domain** layers.

---

## 3. Persistence Ignorance: Domain Model vs. Data Model

- **Data Model**: The schema representation optimized for storage (e.g., tables, columns, indexes).
- **Domain Model**: The object graph representation optimized for enforcing business rules, invariants, and lifecycle transitions.

In complex domains, the Domain Model and Data Model should be separated. The repository implementation maps the data retrieved from the ORM database context into rich, behavior-driven domain entities.

### TypeScript Example: Complete Flow (Separation of Layers)

#### 3.1 Domain Layer: Aggregate and Repository Interface
```typescript
// domain/Employee.ts
import { Money } from "./Money.ts";

export class Employee {
  public readonly id: string;
  private _salary: Money;

  public constructor(id: string, salary: Money) {
    this.id = id;
    this._salary = salary;
  }

  public get salary(): Money {
    return this._salary;
  }

  public updateSalary = (newSalary: Money): void => {
    if (newSalary.amount < 0) {
      throw new Error("Invalid salary amount");
    }
    this._salary = newSalary;
  };
}

// domain/EmployeeRepository.ts
export interface EmployeeRepository {
  findById: (id: string) => Promise<Employee | null>;
  save: (employee: Employee) => Promise<void>;
}
```

#### 3.2 Application Layer: DTO and Service Orchestrator
```typescript
// application/UpdateSalaryDto.ts
export interface UpdateSalaryDto {
  employeeId: string;
  amount: number;
  currency: string;
}

// application/SalaryApplicationService.ts
import { EmployeeRepository } from "../domain/EmployeeRepository.ts";
import { Money } from "../domain/Money.ts";
import { UpdateSalaryDto } from "./UpdateSalaryDto.ts";

export class SalaryApplicationService {
  private readonly employeeRepository: EmployeeRepository;

  public constructor(employeeRepository: EmployeeRepository) {
    this.employeeRepository = employeeRepository;
  }

  public updateEmployeeSalary = async (dto: UpdateSalaryDto): Promise<void> => {
    const employee = await this.employeeRepository.findById(dto.employeeId);
    if (null === employee) {
      throw new Error(`Employee with ID ${dto.employeeId} not found`);
    }

    const newSalary = Money.create(dto.amount, dto.currency);
    employee.updateSalary(newSalary);

    await this.employeeRepository.save(employee);
  };
}
```

#### 3.3 Presentation Layer: Express/Hono-Style Controller
```typescript
// presentation/EmployeeController.ts
import { SalaryApplicationService } from "../application/SalaryApplicationService.ts";

export class EmployeeController {
  private readonly salaryService: SalaryApplicationService;

  public constructor(salaryService: SalaryApplicationService) {
    this.salaryService = salaryService;
  }

  // Controller maps HTTP parameters to DTO, calls application service, returns JSON
  public updateSalary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { amount, currency } = req.body;
      const { employeeId } = req.params;

      const dto = { employeeId, amount: Number(amount), currency: String(currency) };
      await this.salaryService.updateEmployeeSalary(dto);

      res.status(200).json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Internal error";
      res.status(400).json({ success: false, error: message });
    }
  };
}
```

#### 3.4 Infrastructure Layer: Drizzle/Prisma Repository Implementation
```typescript
// infrastructure/DbEmployeeRepository.ts
import { Employee } from "../domain/Employee.ts";
import { EmployeeRepository } from "../domain/EmployeeRepository.ts";
import { Money } from "../domain/Money.ts";

// Database schema definition (Data Model)
interface DbEmployeeRow {
  id: string;
  salary_amount: number;
  salary_currency: string;
}

export class DbEmployeeRepository implements EmployeeRepository {
  private readonly dbClient: DatabaseClient;

  public constructor(dbClient: DatabaseClient) {
    this.dbClient = dbClient;
  }

  public findById = async (id: string): Promise<Employee | null> => {
    const row = await this.dbClient.query<DbEmployeeRow>(
      "SELECT * FROM employees WHERE id = $1 LIMIT 1",
      [id]
    );
    if (0 === row.length) {
      return null;
    }

    // Mapping Data Model -> Domain Model (Enforcing Persistence Ignorance)
    const money = Money.create(row[0]["salary_amount"], row[0]["salary_currency"]);
    return new Employee(row[0]["id"], money);
  };

  public save = async (employee: Employee): Promise<void> => {
    await this.dbClient.execute(
      "UPDATE employees SET salary_amount = $1, salary_currency = $2 WHERE id = $3",
      [employee.salary.amount, employee.salary.currency, employee.id]
    );
  };
}
```
