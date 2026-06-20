import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const cleanArchitecture = [
  {
    level: 1,
    text: "Clean Architecture and Separation of Layers",
    type: "header"
  },
  {
    text: "Clean Architecture separates business rules from frameworks, databases, user interfaces, and external systems. It ensures the codebase remains testable, maintainable, and independent of technological volatility.",
    type: "text"
  },
  {
    level: 2,
    text: "1. The Four Layers of Clean Architecture",
    type: "header"
  },
  {
    code: "┌─────────────────────────────────────────────────────────────┐\n│                      Presentation Layer                     │\n│               (Controllers, Routes, Endpoints)              │\n└──────────────────────────────┬──────────────────────────────┘\n                               │ (calls)\n                               ▼\n┌─────────────────────────────────────────────────────────────┐\n│                      Application Layer                      │\n│             (Use Cases, DTOs, Handlers, Mediators)          │\n└──────────────────────────────┬──────────────────────────────┘\n                               │ (orchestrates)\n                               ▼\n┌─────────────────────────────────────────────────────────────┐\n│                        Domain Layer                         │\n│             (Entities, Value Objects, Aggregates)           │\n└─────────────────────────────────────────────────────────────┘\n                               ▲\n                               │ (interfaces implemented by)\n┌──────────────────────────────┴──────────────────────────────┐\n│                     Infrastructure Layer                    │\n│             (Databases, ORMs, HTTP clients, Buses)          │\n└──────────────────────────────┴──────────────────────────────┘",
    language: "",
    type: "codeBlock"
  },
  {
    level: 3,
    text: "1.1 Presentation Layer",
    type: "header"
  },
  {
    items: [
      {
        text: "**Role**: The entry point of the system (API endpoints, controllers, serverless handlers)."
      },
      {
        text: "**Responsibilities**:\n- Handles incoming network requests, parses payloads, and validates basic HTTP parameters.\n- Binds incoming requests to Data Transfer Objects (DTOs).\n- Delegates the execution of the request to the application layer.\n- Serializes response data (e.g., as JSON, HTML) and returns the HTTP status."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "1.2 Application Layer",
    type: "header"
  },
  {
    items: [
      {
        text: "**Role**: Orchestrates the workflows of the system's use cases."
      },
      {
        text: '**Responsibilities**:\n- Defines the operational steps for specific tasks (e.g., "Hire Employee", "Finalize Order").\n- Retrieves domain aggregates from repositories (defined as interfaces).\n- Invokes domain model behaviors or domain services.\n- Persists changes back through repository interfaces.\n- Formulates command responses or view models to return to the presentation layer.'
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "1.3 Domain Layer",
    type: "header"
  },
  {
    items: [
      {
        text: "**Role**: Contains the pure business rules, logic, and state validations of the business."
      },
      {
        text: "**Responsibilities**:\n- Encapsulates entities, value objects, and aggregates.\n- Implements core algorithmic domain services.\n- **No dependencies**: The domain layer must not import classes, packages, or annotations from the presentation, application, or infrastructure layers."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "1.4 Infrastructure Layer",
    type: "header"
  },
  {
    items: [
      {
        text: "**Role**: Implements technical details, databases, file systems, and network communication."
      },
      {
        text: "**Responsibilities**:\n- Implements database adapters and repositories using ORMs (e.g., Prisma, Drizzle).\n- Manages database transactions and connection strings.\n- Integrates third-party services, queues, and message buses (e.g., RabbitMQ, Kafka, WebSockets)."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "2. Inward-Flowing Dependency Rule",
    type: "header"
  },
  {
    text: "Dependencies must flow inward only:",
    type: "text"
  },
  {
    items: [
      {
        text: "Code in the **Domain** layer cannot depend on any other layer."
      },
      {
        text: "Code in the **Application** layer can only depend on the **Domain** layer. It interacts with the Infrastructure layer *only* via interfaces (e.g., repository interfaces)."
      },
      {
        text: "Code in the **Infrastructure** and **Presentation** layers can depend on the **Application** and **Domain** layers."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "3. Persistence Ignorance: Domain Model vs. Data Model",
    type: "header"
  },
  {
    items: [
      {
        text: "**Data Model**: The schema representation optimized for storage (e.g., tables, columns, indexes)."
      },
      {
        text: "**Domain Model**: The object graph representation optimized for enforcing business rules, invariants, and lifecycle transitions."
      }
    ],
    type: "unorderedList"
  },
  {
    text: "In complex domains, the Domain Model and Data Model should be separated. The repository implementation maps the data retrieved from the ORM database context into rich, behavior-driven domain entities.",
    type: "text"
  },
  {
    level: 3,
    text: "TypeScript Example: Complete Flow (Separation of Layers)",
    type: "header"
  },
  {
    level: 3,
    text: "3.1 Domain Layer: Aggregate and Repository Interface",
    type: "header"
  },
  {
    code: '// domain/Employee.ts\nimport { Money } from "./Money.ts";\n\nexport class Employee {\n  public readonly id: string;\n  private _salary: Money;\n\n  public constructor(id: string, salary: Money) {\n    this.id = id;\n    this._salary = salary;\n  }\n\n  public get salary(): Money {\n    return this._salary;\n  }\n\n  public updateSalary = (newSalary: Money): void => {\n    if (newSalary.amount < 0) {\n      throw new Error("Invalid salary amount");\n    }\n    this._salary = newSalary;\n  };\n}\n\n// domain/EmployeeRepository.ts\nexport interface EmployeeRepository {\n  findById: (id: string) => Promise<Employee | null>;\n  save: (employee: Employee) => Promise<void>;\n}',
    language: "typescript",
    type: "codeBlock"
  },
  {
    level: 3,
    text: "3.2 Application Layer: DTO and Service Orchestrator",
    type: "header"
  },
  {
    code: '// application/UpdateSalaryDto.ts\nexport interface UpdateSalaryDto {\n  employeeId: string;\n  amount: number;\n  currency: string;\n}\n\n// application/SalaryApplicationService.ts\nimport { EmployeeRepository } from "../domain/EmployeeRepository.ts";\nimport { Money } from "../domain/Money.ts";\nimport { UpdateSalaryDto } from "./UpdateSalaryDto.ts";\n\nexport class SalaryApplicationService {\n  private readonly employeeRepository: EmployeeRepository;\n\n  public constructor(employeeRepository: EmployeeRepository) {\n    this.employeeRepository = employeeRepository;\n  }\n\n  public updateEmployeeSalary = async (dto: UpdateSalaryDto): Promise<void> => {\n    const employee = await this.employeeRepository.findById(dto.employeeId);\n    if (null === employee) {\n      throw new Error(`Employee with ID ${dto.employeeId} not found`);\n    }\n\n    const newSalary = Money.create(dto.amount, dto.currency);\n    employee.updateSalary(newSalary);\n\n    await this.employeeRepository.save(employee);\n  };\n}',
    language: "typescript",
    type: "codeBlock"
  },
  {
    level: 3,
    text: "3.3 Presentation Layer: Express/Hono-Style Controller",
    type: "header"
  },
  {
    code: '// presentation/EmployeeController.ts\nimport { SalaryApplicationService } from "../application/SalaryApplicationService.ts";\n\nexport class EmployeeController {\n  private readonly salaryService: SalaryApplicationService;\n\n  public constructor(salaryService: SalaryApplicationService) {\n    this.salaryService = salaryService;\n  }\n\n  // Controller maps HTTP parameters to DTO, calls application service, returns JSON\n  public updateSalary = async (req: Request, res: Response): Promise<void> => {\n    try {\n      const { amount, currency } = req.body;\n      const { employeeId } = req.params;\n\n      const dto = { employeeId, amount: Number(amount), currency: String(currency) };\n      await this.salaryService.updateEmployeeSalary(dto);\n\n      res.status(200).json({ success: true });\n    } catch (error: unknown) {\n      const message = error instanceof Error ? error.message : "Internal error";\n      res.status(400).json({ success: false, error: message });\n    }\n  };\n}',
    language: "typescript",
    type: "codeBlock"
  },
  {
    level: 3,
    text: "3.4 Infrastructure Layer: Drizzle/Prisma Repository Implementation",
    type: "header"
  },
  {
    code: '// infrastructure/DbEmployeeRepository.ts\nimport { Employee } from "../domain/Employee.ts";\nimport { EmployeeRepository } from "../domain/EmployeeRepository.ts";\nimport { Money } from "../domain/Money.ts";\n\n// Database schema definition (Data Model)\ninterface DbEmployeeRow {\n  id: string;\n  salary_amount: number;\n  salary_currency: string;\n}\n\nexport class DbEmployeeRepository implements EmployeeRepository {\n  private readonly dbClient: DatabaseClient;\n\n  public constructor(dbClient: DatabaseClient) {\n    this.dbClient = dbClient;\n  }\n\n  public findById = async (id: string): Promise<Employee | null> => {\n    const row = await this.dbClient.query<DbEmployeeRow>(\n      "SELECT * FROM employees WHERE id = $1 LIMIT 1",\n      [id]\n    );\n    if (0 === row.length) {\n      return null;\n    }\n\n    // Mapping Data Model -> Domain Model (Enforcing Persistence Ignorance)\n    const money = Money.create(row[0]["salary_amount"], row[0]["salary_currency"]);\n    return new Employee(row[0]["id"], money);\n  };\n\n  public save = async (employee: Employee): Promise<void> => {\n    await this.dbClient.execute(\n      "UPDATE employees SET salary_amount = $1, salary_currency = $2 WHERE id = $3",\n      [employee.salary.amount, employee.salary.currency, employee.id]\n    );\n  };\n}',
    language: "typescript",
    type: "codeBlock"
  }
] as MarkdownBlock[];
