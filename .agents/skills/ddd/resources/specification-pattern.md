# The Specification Pattern

The Specification Pattern encapsulates business rules and criteria into dedicated, reusable objects. It solves the problem of scattered, duplicated, and inconsistent validation or filtering logic across different layers.

---

## 1. Core Use Cases

1. **In-Memory Validation**: Checking if an object loaded in memory complies with specific business criteria (e.g., is this product eligible for a discount?).
2. **Database Querying**: Filtering data in the database using the exact same business criteria, ensuring consistency between query and validation logic.
3. **Guided Object Creation**: Determining how a new object should be constructed or selecting valid items from a pool to generate packages or suggestions.

---

## 2. C# Expression Trees vs. TypeScript

- **In C# (LINQ/EF Core)**: Specifications can return an `Expression<Func<T, bool>>` (an Expression Tree). EF Core parses this tree at runtime to generate SQL `WHERE` clauses, while the specification compiles it into a delegate for in-memory checks.
- **In TypeScript**: JavaScript and TypeScript lack runtime Expression Trees. Thus, we represent specifications using:
  - **Predicates**: `(item: T) => boolean` functions for in-memory filtering.
  - **Query Adapters**: A separate method (e.g., `toQueryFilter()`) that returns a query builder object or filter object compatible with standard ORMs like Prisma or Drizzle.

---

## 3. TypeScript Specification Implementation

### 3.1 Base Specification Class

```typescript
export abstract class Specification<T> {
  // Evaluates the business rule against a single object in-memory
  public abstract isSatisfiedBy: (item: T) => boolean;

  // Composes specifications using logical AND operator
  public and = (other: Specification<T>): Specification<T> => {
    return new AndSpecification(this, other);
  };

  // Composes specifications using logical OR operator
  public or = (other: Specification<T>): Specification<T> => {
    return new OrSpecification(this, other);
  };

  // Negates the specification
  public not = (): Specification<T> => {
    return new NotSpecification(this);
  };
}

class AndSpecification<T> extends Specification<T> {
  private readonly left: Specification<T>;
  private readonly right: Specification<T>;

  public constructor(left: Specification<T>, right: Specification<T>) {
    super();
    this.left = left;
    this.right = right;
  }

  public isSatisfiedBy = (item: T): boolean => {
    return this.left.isSatisfiedBy(item) && this.right.isSatisfiedBy(item);
  };
}

class OrSpecification<T> extends Specification<T> {
  private readonly left: Specification<T>;
  private readonly right: Specification<T>;

  public constructor(left: Specification<T>, right: Specification<T>) {
    super();
    this.left = left;
    this.right = right;
  }

  public isSatisfiedBy = (item: T): boolean => {
    return this.left.isSatisfiedBy(item) || this.right.isSatisfiedBy(item);
  };
}

class NotSpecification<T> extends Specification<T> {
  private readonly spec: Specification<T>;

  public constructor(spec: Specification<T>) {
    super();
    this.spec = spec;
  }

  public isSatisfiedBy = (item: T): boolean => {
    return !this.spec.isSatisfiedBy(item);
  };
}
```

### 3.2 Concrete Specification Example

```typescript
export interface Product {
  price: number;
  stock: number;
  category: string;
}

// Concrete rule for Premium Products
export class PremiumProductSpecification extends Specification<Product> {
  public isSatisfiedBy = (product: Product): boolean => {
    const minPrice = 100;
    const minStock = 5;
    const allowedCategories = ["electronics", "office"];

    return (
      product.price >= minPrice &&
      product.stock >= minStock &&
      allowedCategories.includes(product.category)
    );
  };
}

// Concrete rule for Available Products
export class ProductAvailableSpecification extends Specification<Product> {
  public isSatisfiedBy = (product: Product): boolean => {
    return product.stock > 0;
  };
}
```

### 3.3 Composing Specifications in Code

```typescript
const premiumSpec = new PremiumProductSpecification();
const availableSpec = new ProductAvailableSpecification();

// Combine rules using the composition API
const premiumAndAvailableSpec = premiumSpec.and(availableSpec);

const phone: Product = { price: 800, stock: 12, category: "electronics" };
const result = premiumAndAvailableSpec.isSatisfiedBy(phone); // returns true
```

---

## 4. Query Adapters (e.g., Prisma Integration)

To support database-level filtering in TypeScript without retrieving all rows into memory, specifications can implement a `toQueryFilter` method:

```typescript
export interface PrismaProductSpecification {
  toQueryFilter: () => Record<string, unknown>;
}

export class PremiumPrismaProductSpecification extends Specification<Product> implements PrismaProductSpecification {
  public isSatisfiedBy = (product: Product): boolean => {
    return product.price >= 100 && product.stock >= 5;
  };

  public toQueryFilter = (): Record<string, unknown> => {
    return {
      price: { gte: 100 },
      stock: { gte: 5 }
    };
  };
}
```
