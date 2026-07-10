import { render, screen } from "@testing-library/react";
import map from "lodash/map.js";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./index.tsx";

vi.mock("@tanstack/react-router", () => {
  return {
    createFileRoute: () => {
      // eslint-disable-next-line unicorn/consistent-function-scoping
      return (config: { component: React.ComponentType }) => {
        return {
          component: config.component
        };
      };
    }
  };
});

vi.mock("../components/layout/main-layout.tsx", () => {
  return {
    MainLayout: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="main-layout">{children}</div>;
    }
  };
});

vi.mock("../components/profile-card.tsx", () => {
  return {
    ProfileCard: () => {
      return <div data-testid="profile-card">Profile Card Content</div>;
    }
  };
});

const PROFILE_CARD = "profile-card";

vi.mock("../components/how-i-work.tsx", () => {
  return {
    HowIWork: () => {
      return <section data-testid="how-i-work">How I work</section>;
    }
  };
});

// eslint-disable-next-line sonar/no-duplicate-string
vi.mock("../components/stack-and-tools.tsx", () => {
  return {
    StackAndTools: () => {
      return <section data-testid="stack-and-tools">Stack and tools</section>;
    }
  };
});

// eslint-disable-next-line sonar/no-duplicate-string
vi.mock("../components/what-ive-shipped.tsx", () => {
  return {
    WhatIveShipped: () => {
      return (
        <section data-testid={WHAT_IVE_SHIPPED}>What I have shipped</section>
      );
    }
  };
});

const WHAT_IVE_SHIPPED = "what-ive-shipped";

const SECTION_ORDER = [
  PROFILE_CARD,
  "how-i-work",
  "stack-and-tools",
  WHAT_IVE_SHIPPED
] as const;

const getSectionOrder = (container: HTMLElement) => {
  return map(SECTION_ORDER, (id) => {
    // eslint-disable-next-line unicorn/require-css-escape
    const element = container.querySelector(`[data-testid="${id}"]`);
    if (!element) {
      return -1;
    }
    return SECTION_ORDER.indexOf(id);
  });
};

describe("Index Route", () => {
  it("renders MainLayout and ProfileCard", () => {
    // @ts-expect-error for test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByTestId("main-layout")).toBeDefined();
    expect(screen.getByTestId(PROFILE_CARD)).toBeDefined();
    expect(screen.getByText("Profile Card Content")).toBeDefined();
  });

  it.each(SECTION_ORDER)("renders the %s section", (testId) => {
    // @ts-expect-error for test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByTestId(testId)).toBeDefined();
  });

  it("renders sections in order: profile, how-i-work, stack, what-ive-shipped", () => {
    // @ts-expect-error for test
    const Component = Route.component;
    const { container } = render(<Component />);
    const positions = getSectionOrder(container);
    const indices = map(positions, (position) => {
      return SECTION_ORDER[position];
    });
    expect(indices).toEqual([...SECTION_ORDER]);
  });

  it("does not render a separate contact section (card is the only CTA)", () => {
    // @ts-expect-error for test
    const Component = Route.component;
    const { container } = render(<Component />);
    expect(container.querySelector('[data-testid="contact"]')).toBeNull();
  });

  it("HowIWork keeps hypothesis-first and adds SWEBOK + DDD emphasis", async () => {
    vi.doUnmock("../components/how-i-work.tsx");

    const { HowIWork } = await import("../components/how-i-work.tsx");
    const { container } = render(<HowIWork />);
    expect(container.querySelectorAll("[data-principle]")).toHaveLength(3);
    const text = container.textContent;
    expect(text).toContain("Hypothesis-first");
    expect(text).toContain("SWEBOK");
    expect(text).toContain("Domain-Driven Design");
    expect(text).not.toContain("sales cycle");
  });

  it("StackAndTools renders three columns", async () => {
    vi.doUnmock("../components/stack-and-tools.tsx");

    const { StackAndTools } = await import("../components/stack-and-tools.tsx");
    const { container } = render(<StackAndTools />);
    expect(container.querySelectorAll("[data-column]")).toHaveLength(3);
  });

  it("StackAndTools includes monorepo + resume tech", async () => {
    vi.doUnmock("../components/stack-and-tools.tsx");

    const { StackAndTools } = await import("../components/stack-and-tools.tsx");
    const { container } = render(<StackAndTools />);
    const text = container.textContent;
    for (const tech of [
      "TypeScript",
      "React",
      "Next.js",
      "React Native",
      "C#/.NET",
      "Hono",
      "Drizzle",
      "vitest",
      "TanStack Router",
      "Radix Themes",
      "Tailwind",
      "Cloudflare Workers",
      "GraphQL",
      "REST",
      "WebSockets",
      "Spring Boot",
      "Redux",
      "TDD",
      "DDD"
    ]) {
      expect(text).toContain(tech);
    }
  });

  it("WhatIveShipped renders projects (no company names, no dates)", async () => {
    vi.doUnmock("../components/what-ive-shipped.tsx");

    const { WhatIveShipped } =
      await import("../components/what-ive-shipped.tsx");
    const { container } = render(<WhatIveShipped />);
    expect(container.querySelectorAll("[data-project]")).toHaveLength(18);
    expect(container.textContent).not.toMatch(
      /LegrandAV|St\. Louis County|EPA|Proagrica/u
    );
    expect(container.textContent).not.toMatch(/2024|2023|2022|2021|2020|2018/u);
  });

  it("WhatIveShipped lists resume in reverse-chron order with Independent Consultant sub-projects at end", async () => {
    vi.doUnmock("../components/what-ive-shipped.tsx");

    const { WhatIveShipped } =
      await import("../components/what-ive-shipped.tsx");
    const { container } = render(<WhatIveShipped />);
    const names = map(
      container.querySelectorAll("[data-name]"),
      ({ textContent }) => {
        return textContent;
      }
    );
    const resumeNames = names.slice(0, 13);
    expect(resumeNames[0]).toContain("Telecom provisioning platform");
    expect(resumeNames[12]).toContain("CMS-driven village trustee site");
  });
});
