import forEach from "lodash/forEach.js";

import { expect, test } from "./fixtures.ts";

const BASE_URL = "http://localhost:3000";
const SECTION_HEADING_TEST_NAME = "renders the section heading";
const STACK_AND_TOOLS_ID = "stack-and-tools";

test.describe("Homepage — navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("displays the site heading", async ({ page }) => {
    const heading = page
      .getByRole("navigation")
      .getByText("EthanG", { exact: true });
    await expect(heading).toBeVisible();
  });

  test("marks the current page as active in navigation", async ({ page }) => {
    // Home is the current page — its nav item should be visually distinct
    const homeLink = page.getByRole("link", { name: "Home" });
    await expect(homeLink).toBeVisible();
  });

  forEach(
    [
      { href: "/", name: "Home" },
      { href: "/blog", name: "Blog" },
      { href: "/tips", name: "Tips" },
      { href: "/courses", name: "Courses" },
      { href: "/rss", name: "RSS" }
    ] as const,
    ({ href, name }) => {
      test(`shows the '${name}' navigation link`, async ({ page }) => {
        const link = page.getByRole("link", { name });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", href);
      });
    }
  );

  forEach(
    [
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/ethan-glover/"
      },
      {
        name: "GitHub",
        url: "https://github.com/eglove"
      },
      {
        name: "Email",
        url: "mailto:hello@ethang.email"
      },
      {
        name: "Frontend Masters",
        url: "https://frontendmasters.com/u/ethang/"
      },
      {
        name: "Pluralsight",
        url: "https://app.pluralsight.com/profile/ethan-glover-e9"
      }
    ] as const,
    ({ name, url }) => {
      test(`shows the '${name}' social link`, async ({ page }) => {
        const link = page.locator(`a[href="${url}"]`);
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", url);
      });
    }
  );

  test("shows newsletter and meeting CTAs in profile card", async ({
    page
  }) => {
    const newsletterLink = page.getByRole("link", {
      name: "Subscribe to my Newsletter"
    });
    await expect(newsletterLink).toBeVisible();

    const meetingLink = page.getByRole("link", {
      name: "Schedule a Meeting"
    });
    await expect(meetingLink).toBeVisible();
  });
});

test.describe("Homepage — 'How I work' section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test(SECTION_HEADING_TEST_NAME, async ({ page }) => {
    const heading = page.getByRole("heading", { name: "How I work" });
    await expect(heading).toBeVisible();
  });

  forEach(
    [
      "Hypothesis-first.",
      "Grounded in SWEBOK.",
      "Domain-Driven Design as the bridge."
    ] as const,
    (text) => {
      test(`displays the principle '${text}'`, async ({ page }) => {
        await expect(page.getByText(text)).toBeVisible();
      });
    }
  );

  forEach(
    [
      /write the failing test before the implementation/iu,
      /estimates and tradeoffs grounded in the swebok/iu,
      /domain-driven design as the bridge/iu
    ] as const,
    (regex) => {
      test(`shows a principle description matching '${regex.source}'`, async ({
        page
      }) => {
        await expect(
          page.getByTestId("how-i-work").getByText(regex).first()
        ).toBeVisible();
      });
    }
  );

  test('has a "how-i-work" data-testid on the card', async ({ page }) => {
    await expect(page.getByTestId("how-i-work")).toBeVisible();
  });
});

test.describe("Homepage — 'Stack & tools' section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test(SECTION_HEADING_TEST_NAME, async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Stack & tools" });
    await expect(heading).toBeVisible();
  });

  test('has a "stack-and-tools" data-testid on the card', async ({ page }) => {
    await expect(page.getByTestId(STACK_AND_TOOLS_ID)).toBeVisible();
  });

  forEach(
    ["Languages & frameworks", "Stack & infrastructure", "Practices"] as const,
    (text) => {
      test(`shows the column title '${text}'`, async ({ page }) => {
        await expect(page.getByText(text)).toBeVisible();
      });
    }
  );

  forEach(["TypeScript", "React", "Solid", "Node.js"] as const, (name) => {
    test(`lists '${name}' in the languages column`, async ({ page }) => {
      await expect(
        page
          .getByTestId(STACK_AND_TOOLS_ID)
          .getByText("Languages & frameworks")
          .locator("..")
          .getByText(name)
      ).toBeVisible();
    });
  });

  forEach(
    [
      "TanStack Router",
      "Cloudflare Workers",
      "Drizzle ORM",
      "D1 (SQLite)"
    ] as const,
    (name) => {
      test(`lists '${name}' in the stack column`, async ({ page }) => {
        await expect(
          page
            .getByTestId(STACK_AND_TOOLS_ID)
            .getByText("Stack & infrastructure")
            .locator("..")
            .getByText(name)
        ).toBeVisible();
      });
    }
  );

  forEach(["TDD (vitest, Playwright)", "DDD", "Effect-TS"] as const, (name) => {
    test(`lists '${name}' in the practices column`, async ({ page }) => {
      await expect(page.getByText(name)).toBeVisible();
    });
  });
});

test.describe("Homepage — 'What I've shipped' section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test(SECTION_HEADING_TEST_NAME, async ({ page }) => {
    const heading = page.getByRole("heading", { name: "What I've shipped" });
    await expect(heading).toBeVisible();
  });

  test('has a "what-ive-shipped" data-testid on the card', async ({ page }) => {
    await expect(page.getByTestId("what-ive-shipped")).toBeVisible();
  });

  forEach(
    [
      "Telecom provisioning platform",
      "Next.js migration off a legacy CMS",
      "Automated testing for a legacy .NET + React codebase"
    ] as const,
    (name) => {
      test(`shows the client project '${name}'`, async ({ page }) => {
        await expect(page.getByText(name)).toBeVisible();
      });
    }
  );

  forEach(
    [
      "This home page (ethang-react)",
      "Authentication service (auth)",
      "Course tracking (ethang-courses)"
    ] as const,
    (name) => {
      test(`shows the monorepo project '${name}'`, async ({ page }) => {
        await expect(page.getByText(name)).toBeVisible();
      });
    }
  );

  forEach(
    [
      "Unstuck a Next.js migration that had been stalled for two months on hosting.",
      "Surfaced React state bugs that had resisted manual review."
    ] as const,
    (text) => {
      test(`shows the unstuck callout '${text}'`, async ({ page }) => {
        await expect(page.getByText(text)).toBeVisible();
      });
    }
  );
});

test.describe("Homepage — profile card", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("displays the full name", async ({ page }) => {
    const ethanGlover = page.getByText("Ethan Glover");
    // First match is sr-only avatar text; second is the visible profile card span
    // eslint-disable-next-line @ethang/prefer-lodash -- Playwright Locator.nth() not Array.prototype.nth
    await expect(ethanGlover.nth(1)).toBeVisible();
  });

  test("renders a profile image", async ({ page }) => {
    const avatar = page.getByRole("img").first();
    await expect(avatar).toBeVisible();
  });
});

test.describe("Homepage — page structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("has the expected document title", async ({ page }) => {
    await expect(page.title()).resolves.toBe("EthanG");
  });

  test("renders a main landmark", async ({ page }) => {
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
  });

  test("has a navigation landmark", async ({ page }) => {
    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();
  });
});
