import { defineRule } from "../../define.ts";

export const concurrencyControl = defineRule({
  content: `# Concurrency Control

## 1. Domain Theory and Conceptual Foundations
Concurrency control is a fundamental discipline in computing systems concerned with coordinating simultaneous access to shared mutable resources to prevent data corruption, race conditions, deadlocks, and livelocks. As described in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 15 (Engineering Foundations), concurrent systems execution can lead to non-deterministic execution paths. Designing safe concurrent software requires a rigorous understanding of hardware execution models, operating system schedulers, and language-specific runtime environments.

### 1.1 Race Conditions and Data Races
- **Data Race**: Occurs when two or more threads in a single process access the same memory location concurrently without synchronization, where at least one access is a write, and the accesses are not ordered by synchronization primitives. Data races violate language memory models and result in undefined behavior.
- **Race Condition**: A higher-level algorithmic flaw where the correctness of a program depends on the relative timing or interleaving of threads or asynchronous tasks (e.g. check-then-act sequences where state changes between the check and the act).

### 1.2 Synchronization Primitives
To serialize access to critical sections, developers employ synchronization primitives:
1. **Mutex (Mutual Exclusion)**: A locking mechanism used to synchronize access to a resource. Only one thread can acquire the lock at a time.
2. **Semaphore**: A variable-based primitive that controls access to a common resource by multiple threads. A counting semaphore maintains a counter representing available resource slots, whereas a binary semaphore behaves like a mutex.
3. **Read/Write Locks**: Optimize performance by allowing multiple concurrent reads (shared access) but restricting writes to exclusive access.
4. **Atomic Operations**: Hardware-supported operations (e.g. Compare-and-Swap - CAS) that execute in a single step without interruption, eliminating lock overhead.

### 1.3 Coffman Deadlock Conditions
A deadlock occurs when a set of concurrent processes are permanently blocked because each process holds a resource and waits for another resource held by another process. For a deadlock to occur, the four **Coffman Conditions** must hold simultaneously:
1. **Mutual Exclusion**: At least one resource must be held in a non-shareable mode.
2. **Hold and Wait**: A process must hold at least one resource and wait to acquire additional resources held by other processes.
3. **No Preemption**: Resources cannot be forcibly taken from a process; they can only be released voluntarily.
4. **Circular Wait**: A closed chain of processes exists such that each process holds one or more resources that are needed by the next process in the chain.

To prevent deadlocks, system designers must break at least one of these conditions (e.g., establishing a global lock acquisition ordering to break the circular wait condition).

### 1.4 Database Concurrency Control and Isolation Levels
In database systems, concurrency control ensures the Atomicity, Consistency, Isolation, and Durability (ACID) properties of transactions:
- **Pessimistic Concurrency Control (PCC)**: Assumes conflicts are common. It locks resources upon initial access, preventing other transactions from modifying them until the lock is released. This can reduce throughput and cause deadlocks.
- **Optimistic Concurrency Control (OCC)**: Assumes conflicts are rare. Transactions read and modify data without locking, then validate before committing. If another transaction modified the data in the meantime, the current transaction rolls back.
- **ANSI SQL Isolation Levels**: Define the degree to which transactions are isolated from one another, mitigating three operational phenomena (Dirty Reads, Non-Repeatable Reads, Phantom Reads):
  1. *Read Uncommitted*: Lowest isolation; allows dirty reads (reading uncommitted changes from other transactions).
  2. *Read Committed*: Prevents dirty reads, but allows non-repeatable reads (re-reading the same row within a transaction can yield different data).
  3. *Repeatable Read*: Prevents dirty and non-repeatable reads, but allows phantom reads (re-executing a query can return new rows added by concurrent transactions).
  4. *Serializable*: Highest isolation; transactions execute as if they were serial, completely eliminating all anomalies.

### 1.5 JavaScript Event Loop and Asynchronous Concurrency
While JavaScript runs on a single-threaded event loop, it achieves concurrency asynchronously through callbacks, Promises, and async/await. Asynchronous operations interleave execution at the boundary of event handler executions:
- **Microtask Queue**: High-priority tasks (e.g., Promise resolutions) that execute immediately after the current script finishes and before the event loop yields to rendering or macrotasks.
- **Macrotask Queue**: Standard event loop tasks (e.g., timers, network responses, user interactions).

In this environment, race conditions manifest when multiple asynchronous network requests are triggered concurrently. If the response for the first request arrives after the second request, it can overwrite the newer state, creating a "stale response override" defect.

## 2. Standard Operating Procedures (SOP)
The agent must design, implement, and verify concurrent and asynchronous code according to the following procedures:

### Step 2.1: Enforce Asynchronous Race Prevention via AbortController
When triggering asynchronous operations (like network fetches, database transactions, or file reads) that update state:
- Instatiate an \`AbortController\` before starting the asynchronous operation.
- Pass the controller's abort signal to the fetch options.
- Cancel the outstanding request inside the clean-up block (e.g., React's clean-up effect function, or event handler clean-ups) to prevent stale state overrides:
\`\`\`typescript
const loadData = (id: string) => {
  const controller = new AbortController();
  const signal = controller.signal;
  
  fetch(\`/api/data/\${id}\`, { signal })
    .then(res => res.json())
    .then(data => {
      if (!signal.aborted) {
        updateState(data);
      }
    })
    .catch(err => {
      if (err.name !== "AbortError") {
        handleError(err);
      }
    });

  return () => controller.abort();
};
\`\`\`

### Step 2.2: Implement an Asynchronous Mutex for Task Queues
When coordinating sequential async executions in JS:
- Use a promise-based queue or lock to serialize operations:
\`\`\`typescript
class AsyncMutex {
  private promise: Promise<void> = Promise.resolve();

  public acquire = async (): Promise<() => void> => {
    let release: () => void = () => {};
    const nextPromise = new Promise<void>(resolve => {
      release = resolve;
    });
    const currentPromise = this.promise;
    this.promise = nextPromise;
    await currentPromise;
    return release;
  };
}
\`\`\`

### Step 2.3: Implement Global Lock Acquisition Ordering
In systems requiring multiple locks or resource acquisitions:
- Establish a strict global ordering of all lock IDs.
- Always acquire locks in ascending order. If resource A has ID 1 and resource B has ID 2, any code requiring both must lock A first, then B. This mathematically eliminates the circular wait condition.

### Step 2.4: Avoid Shared Mutable State
- Prefer immutable data structures.
- Use readonly modifiers in TypeScript interfaces to prevent accidental modification of shared variables.
- Pass data between concurrent contexts (e.g. Web Workers or Node cluster processes) via message passing (structured clones) rather than shared memory buffers.

### Step 2.5: Validate Concurrency Control under Load
- Write integration tests simulating high-concurrency environments (e.g. firing 100 simultaneous requests to an API endpoint).
- Run the verification command suite to ensure correctness and zero compilation errors:
\`\`\`bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build test
rtk pnpm --filter @ethang/agents-build lint
\`\`\`

## 3. Agent Compliance Checklist
The agent must verify compliance with the following concurrency control rules:

- [ ] **Async Requests Abortable**: Are all component-level asynchronous network fetches configured with an \`AbortController\`?
- [ ] **Stale Responses Blocked**: Does the code verify that the abort signal has not fired before setting the component state?
- [ ] **Lock Ordering Established**: If multiple locks are acquired, does the execution path follow a strict, documented acquisition order?
- [ ] **No Deadlocks Possible**: Did the agent verify that Coffman circular wait conditions are broken in locking paths?
- [ ] **State Immutable**: Are shared data models and configurations declared as \`readonly\` in TypeScript?
- [ ] **Atomic Primitives Used**: Are atomic operations used where lock-free synchronization is possible?
- [ ] **Worker Communication Isolated**: Do Web Workers or sub-processes communicate exclusively via structured cloning messages?
- [ ] **Error Handling on Abort**: Does the asynchronous fetch error handler filter out \`AbortError\` exceptions from user-facing logs?
- [ ] **Event Loop Blocking Avoided**: Are CPU-heavy operations delegated to Workers or sliced into microtasks to prevent blocking the main thread?
- [ ] **No Native Dates**: Are timezone and timing coordinates in concurrency logs represented using Luxon (\`DateTime\`)?
- [ ] **Forbidden Words Checked**: Has the rule been scanned to confirm no forbidden enterprise vocabularies are present?
- [ ] **Size Bounds Confirmed**: Is the compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Escaped Backticks**: Are all code blocks and backticks inside the rule template properly escaped?
- [ ] **Verification Command Run**: Did the agent run verification (build, test, lint) using the \`rtk\` command prefix?
- [ ] **Walkthrough Updated**: Are concurrency tests, race mitigation results, and build logs documented in \`walkthrough.md\`?
- [ ] **Index Signature Bracket Access**: Are dynamic properties on index-signature objects accessed via bracket notation?
- [ ] **Void Assertions Wrapped**: Are unit test cases verifying lack of exceptions wrapped in \`expect(() => ...).not.toThrow()\`?
- [ ] **Arrow Functions Enforced**: Are all function declarations defined as arrow functions?
- [ ] **Tuple Typing Explicit**: Are tuples in Vitest \`it.each\` tables explicitly typed to prevent compiler resolution mismatches?
- [ ] **State Reducers Pure**: Are state machines and state reducers completely free of async operations or side-effects?
- [ ] **Timeout Safeguards Configured**: Do all lock acquisitions and remote fetches configure timeout thresholds to prevent perpetual blocking?`,
  description:
    "concurrency control, synchronization primitives, race conditions, deadlocks, and thread safety",
  filename: "concurrency-control",
  trigger: "model_decision"
});
