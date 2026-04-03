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

const generatePageNumbers = (
  current: number,
  max: number,
): (number | "...")[] => {
  if (max <= 1) return [];

  const pages: (number | "...")[] = [];
  const range = 2;

  for (let i = 1; i <= max; i++) {
    if (
      i === 1 ||
      i === max ||
      (i >= current - range && i <= current + range)
    ) {
      if (
        pages.length > 0 &&
        pages[pages.length - 1] !== "..." &&
        i - (pages[pages.length - 1] as number) > 1
      ) {
        pages.push("...");
      }
      pages.push(i);
    }
  }

  return pages;
};

export const Blog = async ({ page = 1 }: { page?: number }) => {
  const { pathname } = globalStore;
  const blogModel = new BlogModel();
  const pageSize = 10;
  const { posts: blogs, maxPages } = await blogModel.getPaginatedBlogs(
    page,
    pageSize,
  );
  const latestBlog = maxBy(blogs, "_updatedAt");

  const title = page === 1 ? "Blog" : `Blog - Page ${page}`;
  const canonicalUrl =
    page === 1
      ? "https://ethang.dev/blog"
      : `https://ethang.dev/blog/page/${page}`;

  const prevUrl =
    page > 1
      ? page === 2
        ? "https://ethang.dev/blog"
        : `https://ethang.dev/blog/page/${page - 1}`
      : undefined;
  const nextUrl =
    page < maxPages
      ? `https://ethang.dev/blog/page/${page + 1}`
      : undefined;

  return (
    <BlogLayout
      title={title}
      pathname={pathname}
      description="Ethan Glover's blog."
      updatedAt={latestBlog?._updatedAt}
      publishedAt={latestBlog?._createdAt}
      canonicalUrl={canonicalUrl}
      {...(prevUrl !== undefined ? { prevUrl } : {})}
      {...(nextUrl !== undefined ? { nextUrl } : {})}
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

      {maxPages > 1 && (
        <nav
          aria-label="Pagination"
          class="flex items-center justify-center gap-1 mt-6"
        >
          {map(generatePageNumbers(page, maxPages), (p) => {
            if (p === "...") {
              return <span class="px-2 text-slate-400">…</span>;
            }
            const isActive = p === page;
            const href = p === 1 ? "/blog" : `/blog/page/${p}`;
            return (
              <Link
                href={href}
                className={twMerge(
                  "px-3 py-1 rounded text-sm",
                  isActive
                    ? "bg-sky-600 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-700",
                )}
                {...(isActive ? { "aria-current": "page" as const } : {})}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      )}

      {page > 1 && (
        <Link
          href={page === 2 ? "/blog" : `/blog/page/${page - 1}`}
          className="fixed bottom-4 left-4 z-50 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300 shadow-lg hover:bg-slate-700"
          aria-label="Previous page"
        >
          ← Prev
        </Link>
      )}

      {page < maxPages && (
        <Link
          href={`/blog/page/${page + 1}`}
          className="fixed bottom-4 right-4 z-50 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300 shadow-lg hover:bg-slate-700"
          aria-label="Next page"
        >
          Next →
        </Link>
      )}
    </BlogLayout>
  );
};
