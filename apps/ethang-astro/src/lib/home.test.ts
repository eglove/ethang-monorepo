import { describe, expect, it } from "vitest";

import { home } from "../../constants/home.ts";

describe("homepage project description", () => {
  it("describes the Astro implementation rather than the removed React app", () => {
    expect(home.MONOREPO_PROJECTS.HOME_PAGE.DETAIL).toBe(
      "Astro, content collections, Tailwind CSS, and Cloudflare Workers. The page you are reading, built from the monorepo's shared content and services."
    );
  });
});
