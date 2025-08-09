import { describe, expect, it } from "vitest";

import app from "./index";

describe("URL Shortener", () => {
  it("should return a HAL-FORMS root response with _links", async () => {
    const response = await app.request("/");
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(json).toStrictEqual({
      _links: {
        links: {
          href: "http://localhost/links",
        },
        self: {
          href: "http://localhost/",
        },
      },
    });
  });

  it("should return HAL-FORMS to describe actions for /links", async () => {
    const response = await app.request("/links");
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(json).toStrictEqual({
      _links: {
        self: { href: "http://localhost/links" },
      },
      _templates: {
        create: {
          contentType: "application/json",
          method: "POST",
          properties: [
            {
              description:
                "The full URL, including the protocol (e.g., https://",
              name: "url",
              prompt: "The URL to shorten",
              required: true,
            },
          ],
          title: "Create a new short link",
        },
      },
    });
  });
});
