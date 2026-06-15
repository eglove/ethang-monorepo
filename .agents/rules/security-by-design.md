---
description: security by design, CIA triad, OWASP Top 10, and STRIDE threat modeling
trigger: model_decision
---

# Security & Privacy by Design

## 1. Domain Theory and Conceptual Foundations
Information security and data privacy must be integrated into the software architecture and construction phases rather than treated as post-development audits. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 13 (Software Security), security by design is the practice of engineering software to ensure confidentiality, integrity, availability, and accountability.

### 1.1 The CIA Triad and Cryptographic Foundations
The CIA Triad is the foundational model of information security:
- **Confidentiality**: Ensuring that data is accessible only to authorized entities. This requires encryption of data at rest (e.g., using AES-256 in GCM mode) and in transit (TLS 1.3), secure key management, and preventing PII or secrets from leaking into logs.
- **Integrity**: Protecting data from unauthorized modification. This requires robust authentication, role-based access control (RBAC), cryptographic hashing (e.g., SHA-256) for data verification, and validation of data at all system boundaries.
- **Availability**: Ensuring that authorized users have timely access to information. This requires rate limiting, load balancing, fault tolerance, and protection against Denial of Service (DoS) attacks.

Under SWEBOK v4 Chapter 13, cryptographic controls represent a primary tactic for ensuring confidentiality and integrity. Key management is the most vulnerable aspect of cryptography; keys must never be hardcoded in source code or committed to repositories. Instead, they must be stored in secure vaults or managed key-value systems (like Cloudflare Worker secrets).

### 1.2 STRIDE Threat Modeling
STRIDE is a threat modeling methodology developed to identify security threats during the design phase:
- **Spoofing**: Pretending to be someone or something else (defense: authentication).
- **Tampering**: Modifying code or data (defense: integrity checks, authorization, digital signatures).
- **Repudiation**: Claiming you did not perform an action (defense: secure auditing, structured logging).
- **Information Disclosure**: Leaking confidential data (defense: encryption, data minimization, access control).
- **Denial of Service**: Exhausting resources to block legitimate users (defense: rate limiting, throttling, caching).
- **Elevation of Privilege**: Gaining unauthorized authorization levels (defense: least privilege access controls).

By applying STRIDE during the synthesis phase, engineers identify vulnerabilities before a single line of code is written, validating that each threat has a corresponding mitigation control in the architecture.

### 1.3 OWASP Top 10 and Injection Defenses
The Open Web Application Security Project (OWASP) Top 10 lists the most critical web application security risks. SQL Injection and Cross-Site Scripting (XSS) represent major injection vulnerabilities:
- **SQL Injection**: Occurs when untrusted user input is concatenated directly into SQL queries. Defense requires using parameterized queries or Object-Relational Mappers (e.g., Drizzle ORM) which automatically bind variables, rendering user input harmless.
- **XSS**: Occurs when untrusted input is reflected back to the browser without sanitization. Defense requires sanitizing inputs and using modern frameworks that escape output by default.

## 2. Standard Operating Procedures (SOP)
The agent must incorporate security controls into every design, database schema, and route handler.

### Step 2.1: Executing STRIDE Threat Reviews
Before writing code, review the architecture against the STRIDE threat categories:
1. **Identify Entry Points**: Locate API endpoints, form submissions, or database connections.
2. **Document Threats**: For each entry point, list potential STRIDE threats in the execution plan.
3. **Specify Mitigations**: Document specific controls (e.g., auth middleware, input validators) for each threat.

### Step 2.2: Preventing SQL Injection in Drizzle ORM
Never write raw SQL queries that concatenate user input. Always use Drizzle's query builder or parameterized sql statements:
```typescript
import { eq } from "drizzle-orm";

interface Account {
  id: string;
  name: string;
}

class MockDrizzleDb {
  public select = () => {
    return this;
  };
  public from = (table: string) => {
    return this;
  };
  public where = async (condition: unknown): Promise<Account[]> => {
    return [{ id: "1", name: "Alice" }];
  };
}

export const getAccountById = async (
  db: MockDrizzleDb,
  accountId: string
): Promise<Account | undefined> => {
  // Safe: automatically parameterized
  const results = await db
    .select()
    .from("accounts")
    .where(eq("id" as any, accountId as any));
    
  return results[0];
};
```

### Step 2.3: Preventing PII and Secret Leaking
Enforce data minimization and privacy boundaries:
1. **Exclude Secrets**: Never log passwords, API keys, JWT tokens, or credit card numbers.
2. **PII Isolation**: Store PII in separate, access-controlled columns and mask them in application logs.
3. **Environment Secrets**: Reference keys and tokens exclusively via environment bindings (e.g., Cloudflare Workers env bindings). Never hardcode secrets in source files.

### Step 2.4: Content Security Policy (CSP) and Secure Headers
When configuring API boundary handlers:
1. **CORS Configuration**: Restrict allowed origins to specific domains rather than using wildcard (`*`) origins.
2. **CSP Injection**: Inject Content-Security-Policy headers restricting script execution, style loading, and frame loading to trusted sources.
3. **Strict Transport Security (HSTS)**: Force HTTPS for all connections.

### Step 2.5: Hono Middleware implementation for JWT Authentication
Below is a Hono authentication middleware class validating JWT signatures and role authorization (RBAC) under strict type safety constraints.

```typescript
import { vi } from "vitest";

interface UserPayload {
  userId: string;
  role: "admin" | "user";
}

class SecurityGateway {
  private secretKey: string;

  public constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  public validateToken = (token: string | undefined): UserPayload | undefined => {
    if (undefined === token) {
      return undefined;
    }
    // Simple mock signature check for demonstration
    if (token.startsWith("valid-token-")) {
      const parts = token.split("-");
      return {
        userId: parts[2] ?? "",
        role: "admin" === parts[3] ? "admin" : "user"
      };
    }
    return undefined;
  };

  public authorizeRole = (payload: UserPayload | undefined, allowedRole: string): boolean => {
    if (undefined === payload) {
      return false;
    }
    return payload["role"] === allowedRole;
  };
}

describe("SecurityGateway Middleware validation", () => {
  it("should authenticate a valid token and retrieve user payload", () => {
    const gateway = new SecurityGateway("my-secret");
    const payload = gateway.validateToken("valid-token-123-admin");
    
    expect(payload).toBeDefined();
    expect(payload?.["userId"]).toBe("123");
    expect(payload?.["role"]).toBe("admin");
  });

  it("should fail validation for an invalid token", () => {
    const gateway = new SecurityGateway("my-secret");
    const payload = gateway.validateToken("invalid-token-hack");
    expect(payload).toBeUndefined();
  });

  it("should enforce RBAC authorization check", () => {
    const gateway = new SecurityGateway("my-secret");
    const payload: UserPayload = { userId: "123", role: "user" };
    
    expect(gateway.authorizeRole(payload, "admin")).toBe(false);
    expect(gateway.authorizeRole(payload, "user")).toBe(true);
  });
});
```

## 3. Agent Compliance Checklist
The agent must verify that all code changes comply with security-by-design principles:

- [ ] **STRIDE Review Conducted**: Did the agent evaluate the changes against the STRIDE threat categories?
- [ ] **Authentication Enforced**: Are all endpoints handling private data gated behind auth middleware?
- [ ] **Least Privilege Applied**: Are access tokens and database credentials restricted to the minimum permissions?
- [ ] **No Raw SQL Concatenation**: Did the agent verify that no raw SQL strings concatenate user inputs?
- [ ] **Drizzle Parameterization**: Are Drizzle ORM queries used for all database selects, inserts, and updates?
- [ ] **No Secret Leaking**: Has the code been scanned to verify that no API keys or passwords are logged or committed?
- [ ] **Cloudflare Env Bindings**: Are all keys and tokens fetched from environment variables or bindings?
- [ ] **Rate Limiting Configured**: Are resource-heavy API routes protected by rate limiting middleware?
- [ ] **Data Minimization Checked**: Does the system collect and store only the minimum required PII?
- [ ] **PII Encrypted at Rest**: Is PII stored in the database encrypted or masked appropriately?
- [ ] **Secure Headers Configured**: Does the API configuration include secure headers (CSP, CORS, HSTS)?
- [ ] **Input Sanitization Complete**: Are all user-supplied text inputs sanitized before database insertion?
- [ ] **XSS Protections Verified**: Did the agent verify that no unescaped user inputs are rendered in React?
- [ ] **Arrow Functions Enforced**: Are all security filters, routers, and helper functions written as arrow functions?
- [ ] **No Explicit Return Types**: Do all TypeScript security helpers rely on compiler type inference?
- [ ] **Explicit Member Modifiers**: Are all methods in security helper classes annotated with public/private?
- [ ] **Bracket notation**: Are dynamic property checks on security context objects written using bracket notation?
- [ ] **Void assertion wrapping**: Are void security methods tested using `expect(() => ...).not.toThrow()`?
- [ ] **No Forbidden Terminology**: Has the code been scanned to verify zero forbidden words are present?
- [ ] **No Git Commit executed**: Did the agent ensure that no git commits or pushes were made?
- [ ] **SWEBOK Security Alignment**: Does the security architecture align with SWEBOK v4 Chapter 13 standards?
- [ ] **RBAC Validated**: Have role-based access checks been implemented and verified?
- [ ] **Secure Key Storage**: Did the agent verify that no cryptographic secrets are written to configuration files?
- [ ] **Content Security Policy Configured**: Are script sources explicitly restricted on the UI layer?
