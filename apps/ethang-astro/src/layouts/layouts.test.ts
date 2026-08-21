import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";

import BaseLayout from "./BaseLayout.astro";

const SITE_ORIGIN = "https://ethang.dev/";

const render = async (
  properties: Record<string, unknown>,
  request?: Request
) => {
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, {
    props: properties,
    request
  } as never);
};

describe("BaseLayout", () => {
  it("renders the default head and the logged-out nav", async () => {
    const html = await render({}, new Request(SITE_ORIGIN));

    expect(html).toContain("<title>Ethan Glover</title>");
    expect(html).toContain('content="website"');
    expect(html).toContain('name="twitter:card" content="summary"');
    expect(html).toContain('href="/login?redirect=%2F"');
  });

  it("renders description, article times, and a canonical link", async () => {
    const html = await render({
      canonicalPath: "/blog/foo",
      description: "A post",
      isArticle: true,
      // eslint-disable-next-line @ethang/prefer-effect-datetime
      publishedTime: new Date("2024-01-01T00:00:00.000Z"),
      title: "Post",
      // eslint-disable-next-line @ethang/prefer-effect-datetime
      updatedTime: new Date("2024-01-02T00:00:00.000Z")
    });

    expect(html).toContain('name="description" content="A post"');
    expect(html).toContain('content="article"');
    expect(html).toContain("article:published_time");
    expect(html).toContain("article:modified_time");
    // Astro.site is not available via AstroContainer, so canonical cannot be computed.
  });

  it("renders the logged-in nav for a valid session cookie", async () => {
    const session = JSON.stringify({
      email: "ada@example.com",
      sessionToken: "token",
      username: "ada"
    });
    const request = new Request(SITE_ORIGIN, {
      headers: { cookie: `session=${session}` }
    });
    const html = await render({}, request);

    expect(html).toContain("ada");
    expect(html).toContain("Logout");
  });

  it("falls back to the login link for an invalid session cookie", async () => {
    const request = new Request(SITE_ORIGIN, {
      headers: { cookie: "session=not-json" }
    });
    const html = await render({}, request);

    expect(html).toContain('href="/login?redirect=%2F"');
  });

  it("points the login link back to the page the visitor came from", async () => {
    const html = await render({}, new Request("https://ethang.dev/rss"));

    expect(html).toContain('href="/login?redirect=%2Frss"');
  });
});
