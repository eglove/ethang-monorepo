import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const cqrsPattern = [
  {
    level: 1,
    text: "Command Query Responsibility Segregation (CQRS)",
    type: "header"
  },
  {
    text: "Command Query Responsibility Segregation (CQRS) separates data reads (Queries) from data writes (Commands) across the entire architecture.",
    type: "text"
  },
  {
    level: 2,
    text: "1. CQS vs. CQRS",
    type: "header"
  },
  {
    items: [
      {
        text: "**CQS (Command-Query Separation)**: A method-level design principle. A method should either change the state of the system (Command) or return data (Query), but never both.\n- *Command*: Alters state, returns success/error status or generated ID. Has side effects.\n- *Query*: Read-only, returns data, has no side effects, and is safe to run repeatedly."
      },
      {
        text: "**CQRS**: An architectural-level design pattern. It segregates read operations from write operations across different classes, models, handlers, and sometimes physical databases."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "2. Refactoring CRUD to a Task-Based UI",
    type: "header"
  },
  {
    text: "Traditional CRUD interfaces expose full records for bulk edits (e.g., a single `Edit Employee` form containing salary, address, personal details, and roles). This makes validation difficult, increases the risk of overriding unrelated data, and fails to reflect user intent.",
    type: "text"
  },
  {
    text: "A **Task-Based UI** models specific business tasks as distinct operations. It guides the user through isolated workflows (e.g., `Give Raise`, `Assign Role`, `Update Address`). This allows:",
    type: "text"
  },
  {
    items: [
      {
        text: "Context-specific validations (e.g., salary raise can only be positive)."
      },
      {
        text: "Precise user intent logging."
      },
      {
        text: "Loose coupling between different domain functionalities."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "3. Command and Query Handlers with a Mediator",
    type: "header"
  },
  {
    text: "Rather than controllers holding direct references to services, repositories, or SQL context, the presentation layer sends a Command or Query object to a central Mediator. The Mediator routes the intent to its registered handler.",
    type: "text"
  },
  {
    code: "┌──────────────┐          Command / Query          ┌──────────┐          Routes to          ┌─────────────────┐\n│  Controller  ├──────────────────────────────────>│ Mediator ├────────────────────────────>│ Command / Query │\n│ (Endpoints)  │                                   │          │                             │     Handler     │\n└──────────────┘                                   └──────────┘                             └─────────────────┘",
    language: "",
    type: "codeBlock"
  },
  {
    level: 3,
    text: "TypeScript Example: Command, Query, and Mediator",
    type: "header"
  },
  {
    code: "// Core types\nexport interface Request<TResponse> {\n  readonly _responseType?: TResponse;\n}\n\nexport interface RequestHandler<TRequest extends Request<TResponse>, TResponse> {\n  handle: (request: TRequest) => Promise<TResponse>;\n}\n\n// Simple Mediator Implementation\nexport class Mediator {\n  private handlers = new Map<string, unknown>();\n\n  public register = <TRequest extends Request<TResponse>, TResponse>(\n    requestName: string,\n    handler: RequestHandler<TRequest, TResponse>\n  ): void => {\n    this.handlers.set(requestName, handler);\n  };\n\n  public send = async <TResponse>(request: Request<TResponse>): Promise<TResponse> => {\n    const key = request.constructor.name;\n    const handler = this.handlers.get(key) as RequestHandler<Request<TResponse>, TResponse> | undefined;\n\n    if (undefined === handler) {\n      throw new Error(`No handler registered for request ${key}`);\n    }\n\n    return handler.handle(request);\n  };\n}",
    language: "typescript",
    type: "codeBlock"
  },
  {
    level: 3,
    text: "3.1 Write Side (Command): Hire Employee",
    type: "header"
  },
  {
    code: '// application/commands/HireEmployeeCommand.ts\nimport { Request } from "../Mediator.ts";\n\nexport class HireEmployeeCommand implements Request<string> {\n  public readonly name: string;\n  public readonly salaryAmount: number;\n\n  public constructor(name: string, salaryAmount: number) {\n    this.name = name;\n    this.salaryAmount = salaryAmount;\n  }\n}\n\n// application/commands/HireEmployeeCommandHandler.ts\nimport { HireEmployeeCommand } from "./HireEmployeeCommand.ts";\nimport { RequestHandler } from "../Mediator.ts";\nimport { EmployeeRepository } from "../../domain/EmployeeRepository.ts";\nimport { Employee } from "../../domain/Employee.ts";\nimport { Money } from "../../domain/Money.ts";\n\nexport class HireEmployeeCommandHandler implements RequestHandler<HireEmployeeCommand, string> {\n  private readonly repository: EmployeeRepository;\n\n  public constructor(repository: EmployeeRepository) {\n    this.repository = repository;\n  }\n\n  public handle = async (command: HireEmployeeCommand): Promise<string> => {\n    const id = crypto.randomUUID();\n    const money = Money.create(command.salaryAmount, "USD");\n    const employee = new Employee(id, money);\n\n    await this.repository.save(employee);\n    return id; // Returns only the identifier of the created resource\n  };\n}',
    language: "typescript",
    type: "codeBlock"
  },
  {
    level: 3,
    text: "3.2 Read Side (Query): Get Employee View Model",
    type: "header"
  },
  {
    code: '// application/queries/GetEmployeeByIdQuery.ts\nimport { Request } from "../Mediator.ts";\nimport { EmployeeReadModel } from "./EmployeeReadModel.ts";\n\nexport class GetEmployeeByIdQuery implements Request<EmployeeReadModel> {\n  public readonly id: string;\n\n  public constructor(id: string) {\n    this.id = id;\n  }\n}\n\n// application/queries/GetEmployeeByIdQueryHandler.ts\nimport { GetEmployeeByIdQuery } from "./GetEmployeeByIdQuery.ts";\nimport { RequestHandler } from "../Mediator.ts";\nimport { EmployeeReadModel } from "./EmployeeReadModel.ts";\n\nexport class GetEmployeeByIdQueryHandler implements RequestHandler<GetEmployeeByIdQuery, EmployeeReadModel> {\n  private readonly dbClient: DatabaseClient;\n\n  public constructor(dbClient: DatabaseClient) {\n    this.dbClient = dbClient;\n  }\n\n  public handle = async (query: GetEmployeeByIdQuery): Promise<EmployeeReadModel> => {\n    // Queries bypass the domain aggregates completely for high performance\n    const row = await this.dbClient.query(\n      "SELECT id, name, salary_amount FROM employees WHERE id = $1 LIMIT 1",\n      [query.id]\n    );\n\n    if (0 === row.length) {\n      throw new Error(`Employee ${query.id} not found`);\n    }\n\n    return {\n      id: row[0]["id"],\n      fullName: row[0]["name"],\n      formattedSalary: `$${row[0]["salary_amount"]}`\n    };\n  };\n}',
    language: "typescript",
    type: "codeBlock"
  },
  {
    level: 2,
    text: "4. Segregating Write and Read Models",
    type: "header"
  },
  {
    text: "By segregating Write and Read models:",
    type: "text"
  },
  {
    items: [
      {
        text: "**Write Models (Aggregates)**: Optimized for transaction consistency, business rule checking, and data isolation. They do not expose getters or properties that allow external mutation."
      },
      {
        text: "**Read Models (DTOs)**: Optimized for presentation requirements, containing pre-formatted fields, aggregated statistics, and denormalized views. They bypass domain logic and use direct SQL database queries."
      }
    ],
    type: "unorderedList"
  }
] as MarkdownBlock[];
