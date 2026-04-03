import map from "lodash/map.js";
import maxBy from "lodash/maxBy.js";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";

import { BlogModel } from "../../models/blog-model.ts";
import { globalStore } from "../../stores/global-store-properties.ts";
import { BlogLayout } from "../layouts/blog-layout.tsx";
import { H1 } from "../typography/h1.tsx";
import { H2 } from "../typography/h2.tsx";
import { HR } from "../typography/hr.tsx";
import { Link } from "../typography/link.tsx";
import { P } from "../typography/p.tsx";

const formattedDateTime = (dateTime: string) => {
  return DateTime.fromISO(dateTime, {
    zone: globalStore.timezone,
  }).toLocaleString({ dateStyle: "medium", timeStyle: "short" });
};

type PageEntry = "..." | number;

const shouldIncludePage = (
  pageNumber: number,
  max: number,
  current: number,
  range: number,
) => {
  const isFirst = 1 === pageNumber;
  const isLast = pageNumber === max;
  const isInRange =
    pageNumber >= current - range && pageNumber <= current + range;
  return isFirst || isLast || isInRange;
};

const needsEllipsis = (pages: PageEntry[], pageNumber: number) => {
  if (0 === pages.length) return false;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- pages.length > 0 guarantees at(-1) returns a value
  const lastEntry = pages.at(-1)!;
  if ("..." === lastEntry) return false;
  return 1 < pageNumber - lastEntry;
};

const generatePageNumbers = (current: number, max: number): PageEntry[] => {
  if (2 > max) return [];

  const pages: PageEntry[] = [];
  const range = 2;

  for (let pageNumber = 1; pageNumber <= max; pageNumber += 1) {
    if (shouldIncludePage(pageNumber, max, current, range)) {
      if (needsEllipsis(pages, pageNumber)) {
        pages.push("...");
      }
      pages.push(pageNumber);
    }
  }

  return pages;
};

const renderPageLink = async (pageNumber: PageEntry, currentPage: number) => {
  if ("..." === pageNumber) {
    return <span className="px-2 text-slate-400">…</span>;
  }
  const isActive = currentPage === pageNumber;
  const href = 1 === pageNumber ? "/blog" : `/blog/page/${pageNumber}`;
  const ariaCurrent = isActive ? "page" : undefined;
  return (
    <Link
      href={href}
      className={twMerge(
        "px-3 py-1 rounded text-sm",
        isActive
          ? "bg-sky-600 text-white font-semibold"
          : "text-slate-300 hover:bg-slate-700",
      )}
      {...(undefined === ariaCurrent ? {} : { "aria-current": ariaCurrent })}
    >
      {pageNumber}
    </Link>
  );
};

const computePreviousUrl = (page: number): string | undefined => {
  if (1 >= page) return undefined;
  if (2 === page) return "https://ethang.dev/blog";
  return `https://ethang.dev/blog/page/${page - 1}`;
};

const computeNextUrl = (page: number, maxPages: number): string | undefined => {
  if (page >= maxPages) return undefined;
  return `https://ethang.dev/blog/page/${page + 1}`;
};

const computeTitle = (page: number): string =>
  1 === page ? "Blog" : `Blog - Page ${page}`;

const computeCanonicalUrl = (page: number): string =>
  1 === page
    ? "https://ethang.dev/blog"
    : `https://ethang.dev/blog/page/${page}`;

export const Blog = async ({ page = 1 }: { page?: number }) => {
  const { pathname } = globalStore;
  const blogModel = new BlogModel();
  const pageSize = 10;
  const { maxPages, posts: blogs } = await blogModel.getPaginatedBlogs(
    page,
    pageSize,
  );
  const latestBlog = maxBy(blogs, "_updatedAt");

  const title = computeTitle(page);
  const canonicalUrl = computeCanonicalUrl(page);
  const previousUrl = computePreviousUrl(page);
  const nextUrl = computeNextUrl(page, maxPages);

  return (
    <BlogLayout
      title={title}
      pathname={pathname}
      canonicalUrl={canonicalUrl}
      description="Ethan Glover's blog."
      updatedAt={latestBlog?._updatedAt}
      publishedAt={latestBlog?._createdAt}
      {...(previousUrl === undefined ? {} : { prevUrl: previousUrl })}
      {...(nextUrl === undefined ? {} : { nextUrl })}
    >
      <div class="flex flex-col items-center justify-center gap-2">
        <H1>{title}</H1>
        <Link
          className="text-sm text-slate-300"
          href="https://ethang.dev/blogRss.xml"
        >
          RSS Feed
        </Link>
      </div>
      <div class="my-6 grid gap-4">
        {map(blogs, async (blog) => {
          return (
            <div>
              <div
                class={twMerge(
                  "text-base uppercase",
                  "Dev Reads" === blog.blogCategory.title && "text-sky-300",
                  "Blog" === blog.blogCategory.title && "text-sky-300",
                )}
              >
                {blog.blogCategory.title}
              </div>
              <H2 className="mt-0 border-none pb-0">
                <Link
                  className="text-slate-300"
                  href={`/blog/${blog.slug.current}`}
                >
                  {blog.title}
                </Link>
              </H2>
              <P className="text-sm not-first:mt-1.5">
                Published: {formattedDateTime(blog._createdAt)}
              </P>
              <P className="text-xs italic not-first:mt-1.5">
                Updated: {formattedDateTime(blog._updatedAt)}
              </P>
              <HR />
            </div>
          );
        })}
      </div>

      {1 < maxPages && (
        <nav
          aria-label="Pagination"
          class="mt-6 flex items-center justify-center gap-1"
        >
          {map(generatePageNumbers(page, maxPages), async (p) =>
            renderPageLink(p, page),
          )}
        </nav>
      )}

      {1 < page && (
        <Link
          aria-label="Previous page"
          href={2 === page ? "/blog" : `/blog/page/${page - 1}`}
          className="fixed bottom-4 left-4 z-50 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300 shadow-lg hover:bg-slate-700"
        >
          ← Prev
        </Link>
      )}

      {page < maxPages && (
        <Link
          aria-label="Next page"
          href={`/blog/page/${page + 1}`}
          className="fixed right-4 bottom-4 z-50 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300 shadow-lg hover:bg-slate-700"
        >
          Next →
        </Link>
      )}
    </BlogLayout>
  );
};
