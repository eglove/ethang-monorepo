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

describe("login page redirect", () => {
  it("redirects to the action-provided path after a successful sign-in", async () => {
    const container = await AstroContainer.create();
    const response = await container.renderToResponse(
      Login as never,
      {
        locals: {
          _actionPayload: {
            actionName: "signIn",
            actionResult: {
              body: '[{"redirect":1,"username":2},"/applications","ada"]',
              contentType: "application/json+devalue",
              status: 200,
              type: "data"
            }
          }
        },
        request: new Request("https://ethang.dev/login?_action=signIn")
      } as never
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/applications");
  });
});
