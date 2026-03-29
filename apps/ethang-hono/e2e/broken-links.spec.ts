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

// Fetches a URL with method and a per-request timeout. Returns the Response on
// success or "timeout" if the AbortController fires. Throws on other errors.
const fetchWithTimeout = async (
  url: string,
  method: "GET" | "HEAD",
): Promise<"timeout" | Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, LINK_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      method,
      // redirect: "manual" — we check the status of the link itself, not the
      // redirect target. A 301/302 is treated as a successful link (the server
      // responded), even though the final destination is not verified.
      redirect: "manual",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof Error && "AbortError" === error.name) return "timeout";
    throw error;
  }
};

const checkUrl = async (url: string): Promise<"timeout" | number> => {
  const headResult = await fetchWithTimeout(url, "HEAD");

  if ("timeout" === headResult) return "timeout";

  // HEAD ok → done.
  if (headResult.ok) return headResult.status;

  // HEAD non-2xx (includes 3xx from redirect:manual) → try GET as fallback.
  // Some servers block HEAD; GET gives us the canonical response.
  const getResult = await fetchWithTimeout(url, "GET");

  return "timeout" === getResult ? "timeout" : getResult.status;
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
  // Map<url, occurrences> — each URL is checked once, tracking every page it
  // appears on so the failure report can show all locations.
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
      const occurrences = linkMap.get(href) ?? [];
      linkMap.set(href, occurrences);

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
