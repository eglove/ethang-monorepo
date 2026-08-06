import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StackAndTools } from "./stack-and-tools.tsx";

describe("StackAndTools", () => {
  it("renders the component with data-testid", () => {
    render(<StackAndTools />);
    expect(screen.getByTestId("stack-and-tools")).toBeDefined();
  });

  it("renders three columns", () => {
    const { container } = render(<StackAndTools />);
    expect(container.querySelectorAll("[data-column]")).toHaveLength(3);
  });

  it("includes all languages, stack items, and practices", () => {
    const { container } = render(<StackAndTools />);
    const text = container.textContent;
    for (const tech of [
      "TypeScript",
      "JavaScript",
      "React",
      "Next.js",
      "React Native",
      "Solid",
      "Node.js",
      "C#/.NET",
      "Python",
      "SQL",
      "TanStack Router",
      "TanStack Query",
      "Radix Themes",
      "Tailwind",
      "Sanity (CMS)",
      "Cloudflare Workers",
      "Hono",
      "Drizzle ORM",
      "D1 (SQLite)",
      "React Query",
      "Redux",
      "GraphQL",
      "REST",
      "WebSockets",
      "Spring Boot",
      "Microservices",
      "TDD (vitest, Playwright)",
      "DDD",
      "Monorepo",
      "Effect-TS",
      "Lodash",
      "Dependency injection",
      "Composable design",
      "Accessibility",
      "SEO",
      "Performance budgeting",
      "Container-driven development",
      "Legacy migrations"
    ]) {
      expect(text).toContain(tech);
    }
  });

  it("renders column titles", () => {
    render(<StackAndTools />);
    expect(screen.getByText("Languages & frameworks")).toBeDefined();
    expect(screen.getByText("Stack & infrastructure")).toBeDefined();
    expect(screen.getByText("Practices")).toBeDefined();
  });
});
