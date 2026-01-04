### Junie Development Guidelines

1. **Development Process**:
    - Follow the order: **Architectural Planning** → **Tests** → **Code**.
    - For every change, start with architectural planning (e.g., C4/sequence diagrams in .puml files).
    - Then, follow ATDD (Acceptance Test-Driven Development): write an acceptance test first (e.g. Storybook interaction test or Playwright E2E).
    - Use the "Double Loop" approach:
        - Outer Loop (ATDD): Write a failing acceptance test that describes the user's goal.
        - Inner Loop (TDD): Write failing unit tests and minimal code to satisfy the acceptance test.
    - If fixing a bug, first create a failing reproduction test that demonstrates the issue.
    - Finally, write the minimal code necessary to pass the tests.
    - Ensure all tests pass before submitting.
2. **Linting**:
    - Run `pnpm lint` from the project root after making changes.
    - Fix all linting errors and warnings. Look at existing project patterns if the fix is unclear.
3. **Building**:
    - Run `pnpm build` from the project root to ensure your changes don’t break the build.
    - All packages in the monorepo must build successfully.
4. **Testing**:
    - Run `pnpm test` from the project root to ensure no regressions were introduced.
5. **SWEBOK Standards**:
    - Adhere to the full spectrum of SWEBOK (Software Engineering Body of Knowledge) principles as defined in `.junie/swebok-v4.txt`.
    - This includes all Knowledge Areas (KAs):
        - **Software Requirements**: Ensure all changes align with project requirements and are properly documented.
        - **Software Architecture**: Maintain architecture diagrams and ensure architectural integrity.
        - **Software Design**: Apply appropriate design patterns and principles for scalable and maintainable systems.
        - **Software Construction**: Write clean, maintainable, and well-structured code. Follow defensive programming (check input values, use assertions). Standardize exception handling: include detailed info in messages, avoid empty catch blocks, and use a centralized reporter if possible.
        - **Software Testing**: Implement rigorous testing (unit, integration, etc.). Prioritize testability in design to ensure modularity and fewer side effects.
        - **Software Engineering Operations**: Consider the operational impact, deployment (e.g., Edge compatibility), and maintenance of software.
        - **Software Maintenance**: Consider long-term maintainability and the impact of changes on existing systems. Aim for uniformity in naming, notations, and syntax.
        - **Software Configuration Management**: Use version control effectively and manage project configurations.
        - **Software Engineering Management**: Follow project management best practices where applicable.
        - **Software Engineering Process**: Adhere to the established development process and seek continuous improvement.
        - **Software Engineering Models and Methods**: Use appropriate modeling (e.g., UML, .puml) and methodology (e.g., ATDD).
        - **Software Quality**: Ensure adherence to quality standards and perform code reviews/linting.
        - **Software Security**: Implement secure coding practices and protect against vulnerabilities.
        - **Software Engineering Professional Practice**: Maintain high standards of professionalism and ethics.
        - **Software Engineering Economics**: Consider the cost-benefit of technical decisions.
        - **Computing Foundations**: Apply fundamental computing principles.
        - **Mathematical Foundations**: Use relevant mathematical concepts and logic.
        - **Engineering Foundations**: Apply general engineering principles to software development.
6. **Documentation**:
    - Update any relevant documentation or READMEs if the changes affect public APIs or project setup.
7. **How I Code**:
    - Follow the principles and practices outlined in the [How I Code](../apps/ethang/public/blog/how-i-code.html) blog.
    - Key takeaways include:
        - **Planning**: Use "Three Amigos" conversations and C4/sequence diagrams before coding to clarify requirements and architecture.
        - **Testing**: Prioritize ATDD and TDD. Use Vitest for unit tests, Playwright for E2E, and Storybook for component testing.
        - **Linting**: Treat ESLint and SonarJS as essential bug-detection tools, not just style enforcers.
        - **Validation**: Use Zod for runtime validation to complement TypeScript.
        - **AI**: Use LLMs as assistants for boilerplate and initial test generation, but always verify output with engineering discipline.
        - **Data & Persistence**: Use Prisma as the primary ORM. Leverage schema-driven development for automatic migrations and type generation. Ensure Edge compatibility.
        - **Accessibility**: Prioritize accessibility in UI development. Use Storybook's accessibility testing and accessible component libraries.
        - **Security**: Adopt a security-first architecture. Use static analysis (ESLint/SonarJS) to detect vulnerabilities like SQL injection or ReDoS.
8. **Component Organization**:
    - Organize components by feature. Each feature should have its own directory containing all related components, layouts, pages, and stories.
    - Components themselves should still follow Atomic Design principles in their implementation and hierarchy, but they are co-located within the feature directory.
    - Every component should have its own Storybook story.
9. **No Comments**:
    - Never comment code. Make sure naming and organization is readable instead.
