import { expect, test } from "@playwright/test";
import get from "lodash/get.js";

// cspell:ignore ethang
import type { GetBlogs } from "../src/models/get-blogs.ts";

import { routes } from "../routes.ts";
import { sanityClient } from "../src/clients/sanity.ts";

const LINK_TIMEOUT_MS = 10_000;
const USER_AGENT = "Mozilla/5.0 ethang-link-checker";

type BrokenLink = {
  pages: { page: string; text: string }[];
  status: "timeout" | number;
  url: string;
};

const checkUrl = async (url: string): Promise<"timeout" | number> => {
  const headController = new AbortController();
  const headTimeout = setTimeout(() => {
    headController.abort();
  }, LINK_TIMEOUT_MS);

  try {
    const headResponse = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      method: "HEAD",
      redirect: "manual",
      signal: headController.signal,
    });
    clearTimeout(headTimeout);

    if (headResponse.ok) return headResponse.status;

    // HEAD succeeded but non-2xx — try GET as fallback
    const getController = new AbortController();
    const getTimeout = setTimeout(() => {
      getController.abort();
    }, LINK_TIMEOUT_MS);

    try {
      const getResponse = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        method: "GET",
        redirect: "manual",
        signal: getController.signal,
      });
      clearTimeout(getTimeout);
      return getResponse.status;
    } catch (getError) {
      clearTimeout(getTimeout);
      if (getError instanceof Error && "AbortError" === getError.name) {
        return "timeout";
      }
      throw getError;
    }
  } catch (headError) {
    clearTimeout(headTimeout);
    if (headError instanceof Error && "AbortError" === headError.name) {
      return "timeout";
    }
    // Server refused HEAD entirely — try GET
    const getController = new AbortController();
    const getTimeout = setTimeout(() => {
      getController.abort();
    }, LINK_TIMEOUT_MS);
    try {
      const getResponse = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        method: "GET",
        redirect: "manual",
        signal: getController.signal,
      });
      clearTimeout(getTimeout);
      return getResponse.status;
    } catch (getError) {
      clearTimeout(getTimeout);
      if (getError instanceof Error && "AbortError" === getError.name) {
        return "timeout";
      }
      throw getError;
    }
  }
};

const blogs = await sanityClient.fetch<GetBlogs>(`*[_type == "blog"] { slug }`);

const ALL_PAGES = [
  "/",
  routes.blog,
  routes.courses,
  routes.signIn,
  routes.tips,
  routes.scrollbarGutter,
  routes.scrollContainers,
  ...blogs.map((b) => `${routes.blog}/${get(b, ["slug", "current"])}`),
];

test("no broken links across all pages", async ({ page }) => {
  // Map<url, Array<{ page, text }>> — deduplicated by URL
  const linkMap = new Map<string, { page: string; text: string }[]>();

  for (const pageUrl of ALL_PAGES) {
    await page.goto(pageUrl, { waitUntil: "networkidle" });

    const links = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement>("a[href]")]
        .filter((a) => a.href.startsWith("http"))
        .map((a) => ({
          href: a.href,
          text: (
            a.textContent?.trim() ??
            a.getAttribute("aria-label") ??
            a.getAttribute("title") ??
            ""
          ).slice(0, 80),
        })),
    );

    for (const { href, text } of links) {
      if (!linkMap.has(href)) {
        linkMap.set(href, []);
      }

      const occurrences = linkMap.get(href)!;

      if (!occurrences.some((o) => o.page === pageUrl)) {
        occurrences.push({ page: pageUrl, text });
      }
    }
  }

  const brokenLinks: BrokenLink[] = [];

  for (const [url, pages] of linkMap) {
    const status = await checkUrl(url);
    const isOk = "timeout" !== status && 200 <= status && 300 > status;

    if (!isOk) {
      brokenLinks.push({ pages, status, url });
    }
  }

  const message = brokenLinks
    .map(({ pages, status, url }) =>
      [
        `[${status}] ${url}`,
        ...pages.map(({ page: p, text }) => `  - "${text}" on ${p}`),
      ].join("\n"),
    )
    .join("\n\n");

  expect(brokenLinks, `Broken links found:\n\n${message}`).toHaveLength(0);
});
