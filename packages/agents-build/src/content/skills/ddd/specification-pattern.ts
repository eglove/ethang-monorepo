import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const specificationPattern = [
  {
    level: 1,
    text: "The Specification Pattern",
    type: "header"
  },
  {
    text: "The Specification Pattern encapsulates business rules and criteria into dedicated, reusable objects. It solves the problem of scattered, duplicated, and inconsistent validation or filtering logic across different layers.",
    type: "text"
  },
  {
    level: 2,
    text: "1. Core Use Cases",
    type: "header"
  },
  {
    items: [
      {
        text: "**In-Memory Validation**: Checking if an object loaded in memory complies with specific business criteria (e.g., is this product eligible for a discount?)."
      },
      {
        text: "**Database Querying**: Filtering data in the database using the exact same business criteria, ensuring consistency between query and validation logic."
      },
      {
        text: "**Guided Object Creation**: Determining how a new object should be constructed or selecting valid items from a pool to generate packages or suggestions."
      }
    ],
    type: "numberedList"
  },
  {
    level: 2,
    text: "2. C# Expression Trees vs. TypeScript",
    type: "header"
  },
  {
    items: [
      {
        text: "**In C# (LINQ/EF Core)**: Specifications can return an `Expression<Func<T, bool>>` (an Expression Tree). EF Core parses this tree at runtime to generate SQL `WHERE` clauses, while the specification compiles it into a delegate for in-memory checks."
      },
      {
        text: "**In TypeScript**: JavaScript and TypeScript lack runtime Expression Trees. Thus, we represent specifications using:\n- **Predicates**: `(item: T) => boolean` functions for in-memory filtering.\n- **Query Adapters**: A separate method (e.g., `toQueryFilter()`) that returns a query builder object or filter object compatible with standard ORMs like Prisma or Drizzle."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "3. TypeScript Specification Implementation",
    type: "header"
  },
  {
    level: 3,
    text: "3.1 Base Specification Class",
    type: "header"
  },
  {
    code: "export abstract class Specification<T> {\n  // Evaluates the business rule against a single object in-memory\n  public abstract isSatisfiedBy: (item: T) => boolean;\n\n  // Composes specifications using logical AND operator\n  public and = (other: Specification<T>): Specification<T> => {\n    return new AndSpecification(this, other);\n  };\n\n  // Composes specifications using logical OR operator\n  public or = (other: Specification<T>): Specification<T> => {\n    return new OrSpecification(this, other);\n  };\n\n  // Negates the specification\n  public not = (): Specification<T> => {\n    return new NotSpecification(this);\n  };\n}\n\nclass AndSpecification<T> extends Specification<T> {\n  private readonly left: Specification<T>;\n  private readonly right: Specification<T>;\n\n  public constructor(left: Specification<T>, right: Specification<T>) {\n    super();\n    this.left = left;\n    this.right = right;\n  }\n\n  public isSatisfiedBy = (item: T): boolean => {\n    return this.left.isSatisfiedBy(item) && this.right.isSatisfiedBy(item);\n  };\n}\n\nclass OrSpecification<T> extends Specification<T> {\n  private readonly left: Specification<T>;\n  private readonly right: Specification<T>;\n\n  public constructor(left: Specification<T>, right: Specification<T>) {\n    super();\n    this.left = left;\n    this.right = right;\n  }\n\n  public isSatisfiedBy = (item: T): boolean => {\n    return this.left.isSatisfiedBy(item) || this.right.isSatisfiedBy(item);\n  };\n}\n\nclass NotSpecification<T> extends Specification<T> {\n  private readonly spec: Specification<T>;\n\n  public constructor(spec: Specification<T>) {\n    super();\n    this.spec = spec;\n  }\n\n  public isSatisfiedBy = (item: T): boolean => {\n    return !this.spec.isSatisfiedBy(item);\n  };\n}",
    language: "typescript",
    type: "codeBlock"
  },
  {
    level: 3,
    text: "3.2 Concrete Specification Example",
    type: "header"
  },
  {
    code: 'export interface Product {\n  price: number;\n  stock: number;\n  category: string;\n}\n\n// Concrete rule for Premium Products\nexport class PremiumProductSpecification extends Specification<Product> {\n  public isSatisfiedBy = (product: Product): boolean => {\n    const minPrice = 100;\n    const minStock = 5;\n    const allowedCategories = ["electronics", "office"];\n\n    return (\n      product.price >= minPrice &&\n      product.stock >= minStock &&\n      allowedCategories.includes(product.category)\n    );\n  };\n}\n\n// Concrete rule for Available Products\nexport class ProductAvailableSpecification extends Specification<Product> {\n  public isSatisfiedBy = (product: Product): boolean => {\n    return product.stock > 0;\n  };\n}',
    language: "typescript",
    type: "codeBlock"
  },
  {
    level: 3,
    text: "3.3 Composing Specifications in Code",
    type: "header"
  },
  {
    code: 'const premiumSpec = new PremiumProductSpecification();\nconst availableSpec = new ProductAvailableSpecification();\n\n// Combine rules using the composition API\nconst premiumAndAvailableSpec = premiumSpec.and(availableSpec);\n\nconst phone: Product = { price: 800, stock: 12, category: "electronics" };\nconst result = premiumAndAvailableSpec.isSatisfiedBy(phone); // returns true',
    language: "typescript",
    type: "codeBlock"
  },
  {
    level: 2,
    text: "4. Query Adapters (e.g., Prisma Integration)",
    type: "header"
  },
  {
    text: "To support database-level filtering in TypeScript without retrieving all rows into memory, specifications can implement a `toQueryFilter` method:",
    type: "text"
  },
  {
    code: "export interface PrismaProductSpecification {\n  toQueryFilter: () => Record<string, unknown>;\n}\n\nexport class PremiumPrismaProductSpecification extends Specification<Product> implements PrismaProductSpecification {\n  public isSatisfiedBy = (product: Product): boolean => {\n    return product.price >= 100 && product.stock >= 5;\n  };\n\n  public toQueryFilter = (): Record<string, unknown> => {\n    return {\n      price: { gte: 100 },\n      stock: { gte: 5 }\n    };\n  };\n}",
    language: "typescript",
    type: "codeBlock"
  }
] as MarkdownBlock[];
