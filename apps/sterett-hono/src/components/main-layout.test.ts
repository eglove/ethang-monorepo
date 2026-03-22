import { describe, expect, it, vi } from "vitest";

vi.mock("../clients/sanity-client.ts", () => ({
  NO_DRAFTS: "!(_id in path('drafts.**'))",
  sanityImage: { image: () => ({}) },
  sterettSanityClient: { fetch: vi.fn() },
}));

import { renderMainLayout } from "../test-utils/render.tsx";

describe("MainLayout", () => {
  it("renders the page title in a title tag", async () => {
    const html = await renderMainLayout({ title: "Test Page Title" });
    expect(html).toContain("Test Page Title");
  });

  it("uses default title when title is not provided", async () => {
    const html = await renderMainLayout({});
    expect(html).toContain("Sterett Creek Village Trustee");
  });

  it("renders the meta description", async () => {
    const html = await renderMainLayout({ description: "Custom description" });
    expect(html).toContain("Custom description");
  });

  it("uses default description when not provided", async () => {
    const html = await renderMainLayout({});
    expect(html).toContain("Sterett Creek Village Trustee Board");
  });

  it("renders last-modified meta tag when updatedAt is provided", async () => {
    const html = await renderMainLayout({ updatedAt: "2024-06-15T12:00:00Z" });
    expect(html).toContain('name="last-modified"');
    expect(html).toContain("2024-06-15T12:00:00Z");
  });

  it("does not render last-modified meta tag when updatedAt is not provided", async () => {
    const html = await renderMainLayout({});
    expect(html).not.toContain('name="last-modified"');
  });

  it("renders navigation links", async () => {
    const html = await renderMainLayout({});
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/news"');
    expect(html).toContain('href="/calendar"');
    expect(html).toContain('href="/files"');
    expect(html).toContain('href="/trustees"');
  });

  it("renders children content", async () => {
    const html = await renderMainLayout({ children: "Hello from children" });
    expect(html).toContain("Hello from children");
  });

  it("renders prefetch link tags when prefetch urls are provided", async () => {
    const html = await renderMainLayout({
      prefetch: ["/calendar?view=month&year=2024&month=6"],
    });
    expect(html).toContain('rel="prefetch"');
    expect(html).toContain("/calendar?view=month");
  });

  it("does not render prefetch links when prefetch is not provided", async () => {
    const html = await renderMainLayout({});
    expect(html).not.toContain('rel="prefetch"');
  });
});
