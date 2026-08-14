import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => {
  return {
    env: {
      ethang_courses: {
        coursesAll: vi.fn(async () => {
          return [];
        })
      },
      ethang_rss: {}
    }
  };
});

import Login from "../pages/login.astro";

describe("login page error state", () => {
  it("renders the error message from the query parameter", async () => {
    const container = await AstroContainer.create();
    const request = new Request(
      "https://ethang.dev/login?error=Session%20expired"
    );
    const html = await container.renderToString(Login as never, {
      request
    });

    expect(html).toContain("Session expired");
  });
});
