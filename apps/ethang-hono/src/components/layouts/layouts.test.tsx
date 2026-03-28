import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { globalStore } from "../../stores/global-store-properties.ts";
import { BlogLayout } from "./blog-layout.tsx";
import { MainLayout, type MainLayoutProperties } from "./main-layout.tsx";

const renderMain = async (
  properties: MainLayoutProperties,
): Promise<string> => {
  const testApp = new Hono();
  testApp.get("/", async (c) => c.html(<MainLayout {...properties} />));
  const response = await testApp.request("/");
  return response.text();
};

describe(MainLayout, () => {
  it("renders full HTML document structure", async () => {
    const html = await renderMain({ children: "content" });

    expect(html).toContain("<html");
    expect(html).toContain("<head");
    expect(html).toContain("<body");
    expect(html).toContain("</html>");
  });

  it("defaults title to EthanG when not provided", async () => {
    const html = await renderMain({ children: "" });

    expect(html).toContain("<title>EthanG</title>");
  });

  it("formats title as EthanG | <title> when provided", async () => {
    const html = await renderMain({ children: "", title: "Blog" });

    expect(html).toContain("<title>EthanG | Blog</title>");
  });

  it("uses default description when not provided", async () => {
    const html = await renderMain({ children: "" });

    expect(html).toContain("Messing around on the web sometimes.");
  });

  it("uses custom description when provided", async () => {
    const html = await renderMain({
      children: "",
      description: "Custom description",
    });

    expect(html).toContain("Custom description");
  });

  it("includes blog RSS link when isBlog is true", async () => {
    const html = await renderMain({
      children: "",
      isBlog: true,
      publishedAt: "2024-01-01",
      updatedAt: "2024-02-01",
    });

    expect(html).toContain("blogRss.xml");
    expect(html).toContain("article:published_time");
    expect(html).toContain("article:modified_time");
  });

  it("does not include blog RSS link when isBlog is false", async () => {
    const html = await renderMain({ children: "", isBlog: false });

    expect(html).not.toContain("article:published_time");
  });

  it("includes canonical link when canonicalUrl is provided", async () => {
    const html = await renderMain({
      canonicalUrl: "https://ethang.dev/page",
      children: "",
    });

    expect(html).toContain('rel="canonical"');
    expect(html).toContain("https://ethang.dev/page");
  });

  it("does not include canonical link when canonicalUrl is absent", async () => {
    const html = await renderMain({ children: "" });

    expect(html).not.toContain('rel="canonical"');
  });

  it("includes text alternate link when textAlternate is provided", async () => {
    const html = await renderMain({
      children: "",
      textAlternate: "/page?format=text",
    });

    expect(html).toContain("text/plain");
    expect(html).toContain("/page?format=text");
  });

  it("includes last-modified meta tag when updatedAt is provided", async () => {
    const updatedAt = "2024-06-15T10:00:00Z";
    const html = await renderMain({ children: "", updatedAt });

    expect(html).toContain('name="last-modified"');
    expect(html).toContain(updatedAt);
  });

  it("does not include last-modified meta tag when updatedAt is absent", async () => {
    const html = await renderMain({ children: "" });

    expect(html).not.toContain('name="last-modified"');
  });

  it("renders children content", async () => {
    const html = await renderMain({ children: "My page content here" });

    expect(html).toContain("My page content here");
  });

  it("registers the navigation script before computing script tags", async () => {
    globalStore.scripts = new Set();
    await renderMain({ children: "" });

    expect(globalStore.scripts.has("components/navigation/navigation")).toBe(
      true,
    );
  });

  it("registers the code client script", async () => {
    globalStore.scripts = new Set();
    await renderMain({ children: "" });

    expect(globalStore.scripts.has("components/code")).toBe(true);
  });

  it("emits a module script tag for each registered script id", async () => {
    globalStore.scripts = new Set([
      "components/code",
      "components/navigation/navigation",
    ]);
    const html = await renderMain({ children: "" });

    expect(html).toContain(
      '<script type="module" src="/scripts/components/navigation/navigation.client.js">',
    );
    expect(html).toContain(
      '<script type="module" src="/scripts/components/code.client.js">',
    );
  });

  it("does not emit script tags for unregistered script ids", async () => {
    globalStore.scripts = new Set();
    const html = await renderMain({ children: "" });

    expect(html).not.toContain(
      '<script type="module" src="/scripts/components/course-completion.client.js">',
    );
  });
});

describe(BlogLayout, () => {
  it("delegates to MainLayout with isBlog=true", async () => {
    const testApp = new Hono();
    testApp.get("/", async (c) =>
      c.html(<BlogLayout title="My Post">Blog content</BlogLayout>),
    );
    const response = await testApp.request("/");
    const html = await response.text();

    expect(html).toContain("<html");
    expect(html).toContain("Blog content");
    expect(html).toContain("blogRss.xml");
  });
});
