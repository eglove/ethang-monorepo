import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { Button } from "./button.tsx";

describe(Button, () => {
  it("renders a button element by default", async () => {
    const html = String(await Button({ children: "Click me", type: "button" }));

    expect(html).toContain("<button");
    expect(html).toContain("Click me");
  });

  it("renders an anchor element when as=a", async () => {
    const testApp = new Hono();
    testApp.get("/", async (c) => {
      const result = await Button({
        as: "a",
        children: "Go here",
        href: "/about",
        type: "button",
      });
      return c.html(result as never);
    });
    const response = await testApp.request("/");
    const html = await response.text();

    expect(html).toContain("<a");
    expect(html).toContain('href="/about"');
    expect(html).toContain("Go here");
  });

  it("applies custom className", async () => {
    const html = String(
      await Button({ children: "x", className: "my-btn", type: "submit" }),
    );

    expect(html).toContain("my-btn");
  });

  it("applies id attribute", async () => {
    const html = String(
      await Button({ children: "x", id: "my-id", type: "reset" }),
    );

    expect(html).toContain('id="my-id"');
  });

  it("falls back to # when as=a has no href", async () => {
    const testApp = new Hono();
    testApp.get("/", async (c) => {
      const result = await Button({
        as: "a",
        children: "Link",
        type: "button",
      });
      return c.html(result as never);
    });
    const response = await testApp.request("/");
    const html = await response.text();

    expect(html).toContain('href="#"');
  });
});
