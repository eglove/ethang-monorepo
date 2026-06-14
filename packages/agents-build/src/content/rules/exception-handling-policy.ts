import { defineRule } from "../../define.ts";

export const exceptionHandlingPolicy = defineRule({
  content: `# Exception Handling Policy

## 1. Domain Theory and Conceptual Foundations
Exception handling is the systematic software engineering practice of responding to the occurrence of anomalous or exceptional conditions during execution, interrupting the normal flow of instruction execution. As documented in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Software Construction and Software Quality chapters, exception handling is a core component of defensive programming, enabling systems to maintain robust, correct, and secure states when encountering external or internal failures.

### 1.1 Correctness vs. Robustness
In software design, correctness and robustness represent two complementary goals:
- **Correctness**: The system's ability to behave exactly as specified under nominal inputs and environment settings. Correctness demands that if the system cannot perform its specified function, it must fail loudly and safely, preventing corrupt data states.
- **Robustness**: The system's ability to gracefully handle abnormal inputs, network latency, resource depletion, or unexpected third-party API failures without crashing.

A comprehensive exception handling policy mediates between these two goals. It ensures that system failures are isolated so that the entire application does not crash (robustness), while guaranteeing that failing transactions are rolled back and errors are logged for intervention (correctness).

### 1.2 The Exception Propagation Model
Modern programming runtimes use a dynamic call-stack propagation model for exceptions. When an error is thrown:
- The runtime pauses execution at the throwing statement and searches the active execution block for a matching catch handler.
- If no handler is found in the local scope, the call stack is unwound. The exception is bubbled up to the calling function, repeating the lookup sequentially.
- If the exception reaches the root of the call stack (the event loop or main entry point) without being caught, it becomes an unhandled exception, causing process termination in Node.js or generating a server-side 500 error in web servers.

Swallowing exceptions (catching them without logging or action) is a severe anti-pattern because it conceals failures, making the system behave as though it succeeded while leaving its internal state corrupted or out of sync.

### 1.3 Recoverable vs. Unrecoverable Errors
A complete design divides anomalies into two operational categories:
1. **Recoverable Errors (Domain Failures)**: Expected deviations in the business workflow (e.g., input validation failures, expired authentication tokens, resource-not-found states). These must be modeled using custom domain error classes and handled gracefully by returning structured error formats to the user, offering a path for remediation.
2. **Unrecoverable Errors (Infrastructure Failures)**: Failures where the system cannot safely continue its current execution path (e.g., database connection loss, out-of-memory errors, disk full conditions). These must be caught at high-level application boundaries, logged with full stack traces, and translate into sanitized failure notifications.

### 1.4 Security and Sensitive Information Disclosure
Exceptions represent a primary vector for information disclosure. Raw stack traces, SQL syntax exceptions, and file system paths contain details about database schemas, host paths, and library versions that attackers exploit to locate vulnerabilities.
- **Sanitization**: All user-facing error payloads must be strictly sanitized. No database queries, database names, system paths, or raw stack traces may ever be returned to clients.
- **Correlation IDs**: To bridge the gap between user notifications and diagnostic logs, systems must generate a unique, cryptographically secure Correlation ID (or Request ID) when an error occurs. This ID is displayed to the user and attached to the internal structured log, allowing engineers to trace the exact execution path without revealing secrets to the client.

## 2. Standard Operating Procedures (SOP)
The agent must apply the following step-by-step procedures to implement exception handling:

### Step 2.1: Define Custom Domain Error Classes
Create explicit, reusable error classes extending the native \`Error\` object for distinct domain boundaries:
- Use typescript subclassing to define classes like \`DomainValidationError\`, \`ResourceNotFoundError\`, and \`InfrastructureError\`.
- Capture relevant metadata in constructor fields (e.g., specific validation constraints, missing resource keys).
- Set explicit error names to enable runtime type guarding using \`instanceof\` checks:
\`\`\`typescript
export class DomainValidationError extends Error {
  public readonly code = "VALIDATION_FAILED";
  constructor(message: string, public readonly fields: Record<string, string>) {
    super(message);
    this.name = "DomainValidationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
\`\`\`

### Step 2.2: Implement Local Catching and Isolation
Wrap network calls, file read/write operations, and JSON parsing in try-catch blocks:
- Restrict the try block to the minimum lines of code that can fail to prevent catching unintended exceptions.
- Translate low-level infrastructure exceptions into high-level custom error instances before propagating.
- Ensure that if an exception occurs during a database transaction, explicit abort/rollback commands are executed to maintain data consistency.

### Step 2.3: Configure Centralized Structured Logging
In catch blocks, route the exception to the workspace logging service:
- Provide structured logs containing the error name, message, stack trace, and context variables (e.g., target user ID, affected resource).
- Generate a Correlation ID and attach it to the log properties.
- Do not log sensitive credentials (API keys, passwords, credit card numbers).

### Step 2.4: Establish High-Level Error Boundaries and Middlewares
Implement catch-all middleware or component boundaries to prevent unhandled rejections:
- **Cloudflare Workers / Hono**: Define global error handlers using \`app.onError((err, c) => { ... })\` to intercept unhandled worker exceptions, log them, and respond with a sanitized JSON payload.
- **Frontend Pages**: Define React Error Boundaries (\`componentDidCatch\`) to intercept component rendering crashes, log the telemetry, and show a fallback interface instead of a blank white screen.

### Step 2.5: Write Exception Path Parameterized Tests
Verify that error pathways behave exactly as expected using unit tests:
- Use mock-injection to force dependency failures (e.g., stubbing a fetch function to throw a network error).
- Assert that the correct custom error class is thrown.
- Assert that the final response contains the generated correlation ID and a sanitized message, rather than raw system details.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding exception handling:

- [ ] **Custom Error Subclassing**: Have all domain-specific errors been implemented using dedicated classes extending \`Error\`?
- [ ] **Try-Catch Abstraction Scope**: Are try-catch blocks restricted to only the statements prone to failure?
- [ ] **Silent Swallow Prevention**: Did the agent verify that no catch block is empty or merely contains an empty comment?
- [ ] **Sanitized API Responses**: Has the agent verified that no database queries, schemas, or raw stack traces are returned in public API payloads?
- [ ] **Correlation ID Generation**: Is a unique Correlation ID attached to both the internal log and the user-facing error response?
- [ ] **Transaction Rollback**: Are database transactions explicitly aborted/rolled back in catch blocks if an error occurs mid-transaction?
- [ ] **Stack Trace Retention**: Are full stack traces logged internally for all unrecoverable infrastructure failures?
- [ ] **Sensitive Data Masking**: Has the logging payload been checked to ensure no passwords, tokens, or PII are written to logs?
- [ ] **Global Middleware Guard**: Is there a global error handler or error boundary active at the application entry point?
- [ ] **Hono app.onError Usage**: If working on a Hono backend, is \`app.onError\` registered to intercept all unhandled exceptions?
- [ ] **TypeScript Type Guards**: Are exceptions evaluated using \`instanceof\` checks rather than parsing error message strings?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Mock Error Testing**: Have unit tests been written that mock failures to assert that catch blocks execute successfully?
- [ ] **Error Event Logging**: Are client-side rendering crashes caught by React Error Boundaries logged to the monitoring backend?
- [ ] **Fallback Values Implementation**: Do critical config lookups return a defined fallback value when exceptions occur?
- [ ] **Http Status Code Mapping**: Do API error handlers return appropriate status codes (e.g., 400 for validation, 404 for missing resource, 500 for system error)?
- [ ] **Promise Rejection Catching**: Are all async operations awaited, or do they have explicit \`.catch()\` handlers attached?
- [ ] **Object.setPrototypeOf Check**: Do custom error constructors invoke \`Object.setPrototypeOf\` to preserve prototype chains in ES5?
- [ ] **Diagnostic Logging Context**: Does every error log contain diagnostic metadata (like correlation ID, user roles, routing path)?
- [ ] **Sonar Assertions wrapped**: Do test cases verifying that a void method executes without issues wrap the call in \`expect(() => ...).not.toThrow()\`?
- [ ] **Explicit Member Access**: Are all methods and properties on custom error helper classes declared with explicit accessibility modifiers?`,
  description:
    "exception handling, central logging, error messages, and robust error control",
  filename: "exception-handling-policy",
  trigger: "model_decision"
});
