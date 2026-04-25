# Product Guidelines

## UI & UX Principles
- **Utility-First Styling:** Utilize Tailwind CSS for rapid, responsive, and consistent styling across all applications.
- **Content-Focused Design:** Adopt a minimalist design approach that prioritizes content readability and user focus, particularly for CMS-driven sites and dashboards.
- **Accessibility:** Ensure all applications meet WCAG accessibility compliance standards to provide an inclusive experience for all users.

## Modularity & Shared Packages
- **Decoupled Utilities:** Keep shared packages small, focused, and highly decoupled (e.g., individual hooks and utilities).
- **Opinionated Configurations:** Provide opinionated, pre-configured tools (like the shared ESLint config) to streamline setup and maintain consistency.
- **Framework-Agnostic Design:** Whenever possible, build packages to be framework-agnostic so they can be utilized across different technology stacks.

## Documentation & Prose Style
- **Self-Documenting Code:** Rely on strict TypeScript typing, clear naming conventions, and modular architecture as the primary form of documentation, minimizing the need for excessive inline comments.
