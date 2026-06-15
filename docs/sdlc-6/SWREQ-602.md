---
id: "SWREQ-602"
type: "software_requirement"
name: "Programmatic Code Smell and Type Correctors"
specification: "The software agent SHALL rewrite duplicate strings to constants and append eslint-disable commands for type exceptions in tests."
derives_from:
  - "SYSARCH-601"
---

# SWREQ-602: Programmatic Code Smell and Type Correctors

## 1. Description
The software must contain automated repair routines to fix standard CI/PR errors:
1. **Duplicate String Literals**: Extract duplicates into constants or central config/test-constants files to comply with SonarQube's duplication rules.
2. **Type Violations in Tests**: Safely apply type-loosening comments or targeted typecasts (such as `as any` or custom signatures) in test files when permitted.
3. **Linter Rule Infractions**: Automatically resolve eslint issues by rewriting files using WebStorm VFS-safe methods to prevent cached synchronization errors.

## 2. Technical Details
- **Duplicate String Resolver**:
  - The resolver SHALL target occurrences of strings containing 3 or more duplicate literals of length > 10.
  - If the occurrences are isolated within a test file, the tool SHALL declare a module-level constant (e.g. `const MY_CONSTANT = "string-value";`) at the top of the file.
  - If the occurrences cross multiple files, the tool SHALL check for or create a `test-constants.ts` file under the package root, export the constant, and update all importing files.
  - The tool SHALL replace all occurrences of the literal with the declared constant.
- **Type Exception Injector**:
  - The injector SHALL scan TypeScript compilation errors in test files.
  - For non-critical type errors, it SHALL append `// eslint-disable-next-line @typescript-eslint/no-explicit-any` or rewrite type assertions to `as any` or `unknown as any`.
- **Linter Autofix Integrations**:
  - The repair engine SHALL run ESLint autofix commands.
  - Modifications to the file system SHALL prioritize using WebStorm MCP file replacement tools to ensure the IDE Virtual File System remains synchronized with the physical files.
