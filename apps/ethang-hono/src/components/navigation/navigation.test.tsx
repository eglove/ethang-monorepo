import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { NavigationButton } from "./navigation-button.tsx";
import { NavigationLink } from "./navigation-link.tsx";
import { Navigation } from "./navigation.tsx";

describe("NavigationButton", () => {
  it("renders a button element", async () => {
    const html = String(await NavigationButton());
    expect(html).toContain("<button");
    expect(html).toContain("</button>");
  });

  it("includes hamburger menu SVG icon", async () => {
    const html = String(await NavigationButton());
    expect(html).toContain("<svg");
    expect(html).toContain("Open main menu");
  });

  it("has data-collapse-toggle attribute for flowbite", async () => {
    const html = String(await NavigationButton());
    expect(html).toContain("data-collapse-toggle");
    expect(html).toContain("navbar-default");
  });
});

describe("NavigationLink", () => {
  it("renders an anchor element", async () => {
    const html = String(
      await NavigationLink({ children: "Home", href: "/", pathname: "/blog" }),
    );
    expect(html).toContain("<a");
    expect(html).toContain("Home");
    expect(html).toContain('href="/"');
  });

  it("applies active styles when pathname matches href", async () => {
    const html = String(
      await NavigationLink({ children: "Blog", href: "/blog", pathname: "/blog" }),
    );
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("bg-brand");
  });

  it("applies inactive styles when pathname does not match href", async () => {
    const html = String(
      await NavigationLink({
        children: "Tips",
        href: "/tips",
        pathname: "/blog",
      }),
    );
    expect(html).not.toContain('aria-current="page"');
    expect(html).not.toContain("bg-brand");
  });

  it("does not include aria-current when not current page", async () => {
    const html = String(
      await NavigationLink({ children: "Tips", href: "/tips", pathname: "/" }),
    );
    expect(html).not.toContain("aria-current");
  });
});

describe("Navigation", () => {
  it("renders a nav element", async () => {
    const testApp = new Hono();
    testApp.get("/", (c) => c.html(<Navigation />));
    const res = await testApp.request("/");
    const html = await res.text();
    expect(html).toContain("<nav");
    expect(html).toContain("</nav>");
  });

  it("includes navigation links for main routes", async () => {
    const testApp = new Hono();
    testApp.get("/", (c) => c.html(<Navigation />));
    const res = await testApp.request("/");
    const html = await res.text();
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/blog"');
    expect(html).toContain('href="/tips"');
    expect(html).toContain('href="/courses"');
  });
});
