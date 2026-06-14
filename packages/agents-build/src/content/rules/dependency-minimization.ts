import { defineRule } from "../../define.ts";

export const dependencyMinimization = defineRule({
  content: `# Dependency Minimization

## 1. Domain Theory and Conceptual Foundations
Dependency minimization is the software design discipline of restricting the introduction of external third-party libraries and modules to the absolute minimum necessary for system feasibility. As described in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Software Design and Software Quality chapters, minimizing dependencies is essential to maintain system integrity, reduce supply chain vulnerabilities, optimize runtime performance, and prevent license compliance issues.

### 1.1 Supply Chain Security Risks
In modern web development, importing an external package is not a zero-cost convenience, but a potential security vulnerability. Dependency trees contain hundreds of transitive dependencies, creating a large, unvetted attack surface. Supply chain risks include:
- **Malicious Code Injection**: Attackers hijacking maintainer accounts to publish updates containing malicious payloads (e.g., stealing environment variables or API keys).
- **Typosquatting**: Attackers publishing packages with names similar to popular libraries, tricking developers into importing malware.
- **Dependency Confusion**: Tricking package managers into fetching a malicious public package instead of an internal private package.

By minimizing dependencies, engineers reduce the likelihood of supply chain vulnerabilities slipping into the system.

### 1.2 Performance and Execution Footprint
Every external dependency increases the bundle size of the application. In serverless or edge runtimes (such as Cloudflare Workers), larger bundle sizes lead to:
- **Longer Cold Start Latencies**: The runtime environment takes longer to boot up, parse, and compile the JavaScript bundle.
- **Memory Consumption**: Excess libraries consume memory, risking execution termination if limits (e.g., 128MB) are exceeded.
- **Network Bandwidth**: Slower client-side download times, hurting Core Web Vitals (such as LCP and FCP).

Engineers must prioritize native runtime APIs (such as Fetch, Web Crypto, URL, and Streams) over third-party utilities (such as Axios, uuid, or request).

### 1.3 Licensing and Legal Compliance
Software licenses fall into two primary categories, which must be carefully audited to prevent legal liability:
- **Permissive Licenses (MIT, Apache 2.0, BSD)**: Allow developers to use, modify, and distribute the code with minimal restrictions, suitable for proprietary software.
- **Copyleft / Viral Licenses (GPL, AGPL)**: Require any derivative work to be open-sourced under the same license. Importing a GPL library into a proprietary commercial application can force the organization to publish its entire source code, creating massive legal exposure.

### 1.4 Maintenance and "Version Hell"
Integrating unmaintained or abandoned packages creates a technical debt liability. If the package becomes incompatible with newer Node.js versions, react runtimes, or compiler specifications, engineers are forced to rewrite the integration or maintain a custom fork.

### 1.5 Permissiveness and Copyleft Details
Understanding the legal implications of licenses is paramount to software governance:
- **MIT License**: Minimal restrictions. Permission is granted to deal in the Software without restriction, subject to including the copyright notice.
- **Apache License 2.0**: Permissive, but requires preservation of the copyright notice and disclaimer, and explicit patent grants from contributors to users.
- **BSD 3-Clause**: Similar to MIT, but adds a clause prohibiting the use of the name of the copyright holder to endorse derivative products without permission.
- **GNU General Public License (GPL)**: Strong copyleft. Any derivative work linking to GPL code (statically or dynamically) must also be licensed under GPL, requiring the publication of all source code.
- **GNU Lesser General Public License (LGPL)**: Weaker copyleft. Permits linking with proprietary modules if the linking is dynamic and users can swap the library version. However, static linking pulls the proprietary code under the copyleft umbrella.
- **Affero GPL (AGPL)**: Closes the "SaaS loophole" of the GPL. If the AGPL code is run on a server and accessed over a network, the source code of the entire server application must be made available to the network users.

To maintain compliance, the agent must perform license audits on all transitive dependencies, ensuring no copyleft dependencies are introduced.

### 1.6 Dependency Tree Pruning and Tree Shaking
Tree shaking refers to the dead-code elimination process used by modern bundlers (e.g., Rollup, ESBuild) to prune unused modules during compilation:
- **Static Analysis**: JavaScript engines rely on ESM syntax (\`import\` and \`export\`) being static. The compiler determines exactly which exports are referenced without executing the code.
- **CommonJS Limitations**: CJS syntax (\`require\` and \`module.exports\`) is dynamic and evaluated at runtime. This prevents compilers from safely determining which exports are unused, forcing them to bundle the entire module.
- **Side Effects**: Some modules perform operations when imported (e.g., modifying globals, registering plugins). Compilers must preserve these modules unless marked with \`"sideEffects": false\` in their \`package.json\`.
- **Transitive Depth**: Transitive dependencies are dependencies of dependencies. A single utility package can pull in dozens of nested modules, increasing the dependency graph's depth, complexity, and compilation overhead.

To optimize bundle sizes, the agent must prioritize ESM packages and structure imports to target specific files or sub-modules rather than the entrypoint.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures to minimize external dependencies in this workspace:

### Step 2.1: Perform Native-First Feasibility Evaluation
Before adding any new dependency to a package manifest (\`package.json\`), the agent must evaluate if the feature can be implemented using native platform capabilities:
- Check if standard Web APIs or ES6+ features cover the requirement (e.g., using \`globalThis.crypto.randomUUID()\` instead of importing the \`uuid\` package, or using \`Array.prototype.flat()\` instead of importing a utility library).
- The agent must document the "Native Alternatives Evaluated" in the \`implementation_plan.md\`.

### Step 2.2: Conduct a Dependency Security and Maintenance Audit
If a native implementation is unfeasible, the agent must research the candidate package:
- **Maintenance Health**: Check the package's commit frequency, open issue count, and release history. Do not use packages that have been inactive for over 12 months.
- **Size Audit**: Use tools like Bundlephobia to inspect the package's minified-and-gzipped size and transitive dependency footprint.
- **CVE Scan**: Check the package against vulnerability databases to ensure it has no active unresolved CVEs.

### Step 2.3: Execute a License Compliance Check
The agent must inspect the candidate library's license terms:
- Verify that the license is permissive (e.g., MIT, Apache 2.0, BSD).
- Explicitly check that no GPL, LGPL (without dynamic link assurances), or AGPL licenses are introduced.
- Reject the library if it contains copyleft clauses in a proprietary context.

### Step 2.4: Wrapper Isolation and Dependency Injection
If the dependency is approved:
- Wrap the library behind a local interface definition (Adapter pattern).
- Client code must interact exclusively with the local wrapper, allowing the underlying package to be updated or swapped without propagating changes.
- Add the package to the correct section of \`package.json\` (e.g., \`devDependencies\` for build-time tools, \`dependencies\` for runtime code).

### Step 2.5: Run Vulnerability Scanning and Verification
After adding a package, the agent must run:
\`\`\`bash
rtk pnpm audit
\`\`\`
to verify that the newly added dependency has not introduced any known vulnerabilities into the monorepo.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding dependency minimization:

- [ ] **Native-First Evaluation**: Has the agent verified that the feature cannot be built using standard Web APIs?
- [ ] **Dependency Audit Record**: Are the candidate library's size, dependencies, and maintenance history documented?
- [ ] **Permissive License Check**: Has the agent verified that the library's license is permissive (MIT/Apache/BSD) and not copyleft (GPL/AGPL)?
- [ ] **CVE Scan Execution**: Was a search conducted to ensure the package has no unresolved security vulnerabilities?
- [ ] **Wrapper Pattern Applied**: Is the external dependency isolated behind a local wrapper interface (Adapter pattern)?
- [ ] **Dependency Injection**: Do client classes depend on local abstractions rather than direct library imports?
- [ ] **package.json Placement**: Has the package been added to the correct category (\`dependencies\` vs \`devDependencies\`)?
- [ ] **Security Scan Clean**: Was \`pnpm audit\` run, and did it return zero vulnerabilities?
- [ ] **Transitive Footprint Reviewed**: Has the agent verified that the package does not import a large tree of transitive sub-dependencies?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Edge Runtime Compatibility**: Has the package been verified as compatible with serverless/edge runtime environments?
- [ ] **Gold-Plating Check**: Has the agent verified that no unrequested utility packages have been introduced?
- [ ] **Lockfile Integrity Check**: Has the lockfile (\`pnpm-lock.yaml\`) been updated and verified during compilation?
- [ ] **Deprecation Check**: Has the agent verified that the package is not marked as deprecated on the registry?
- [ ] **Code Duplication Audit**: Did the agent verify that the library doesn't duplicate functionality already present in another workspace package?
- [ ] **Build Time Impact**: Has the compilation and build time of the package been verified as unaffected?
- [ ] **Walkthrough Verification**: Does the \`walkthrough.md\` document the rationale for the new dependency and its audit results?
- [ ] **Permissiveness Matrix**: Has the license type been verified against a permissiveness matrix to ensure no copyleft clauses?
- [ ] **Tree Shaking Optimization**: Have imports been structured to allow static tree shaking (e.g., importing specific ESM methods rather than full libraries)?
- [ ] **Transitive Audit**: Did the agent verify that no sub-dependencies have copyleft or deprecated licenses?
- [ ] **Security Vulnerability Scan**: Has an automated vulnerability scanner been run on the lockfile to check for supply chain risks?`,
  description: "dependency minimization, supply chain risk, and license audits",
  filename: "dependency-minimization",
  trigger: "model_decision"
});
