import map from "lodash/map.js";
import orderBy from "lodash/orderBy.js";

import { BlogLayout } from "../layouts/blog-layout.tsx";
import { H1 } from "../typography/h1.tsx";
import { H2 } from "../typography/h2.tsx";
import { Link } from "../typography/link.tsx";
import { P } from "../typography/p.tsx";
import { developmentJobsTrendingPublished } from "./blog/development-jobs-trending-upward.tsx";
import { wtfIsVinextPublished } from "./blog/wtf-is-vinext.tsx";

const blogs = orderBy(
  [
    {
      date: developmentJobsTrendingPublished,
      title: "Dev job postings are finally trending upward",
      url: "/blog/development-jobs-trending-upward",
    },
    {
      date: wtfIsVinextPublished,
      title: "WTF is vinext",
      url: "/blog/wtf-is-vinext",
    },
  ],
  ["date"],
  "desc",
);

export const Blog = async () => {
  return (
    <BlogLayout title="Blog" description="Ethan Glover's blog.">
      <H1>Blog</H1>
      <div class="my-6 grid gap-4">
        {map(blogs, async (blog) => {
          return (
            <div>
              <H2>
                <Link href={blog.url}>{blog.title}</Link>
              </H2>
              <P className="my-1.5 text-sm">
                {blog.date.toLocaleString(undefined, {
                  dateStyle: "medium",
                })}
              </P>
            </div>
          );
        })}
      </div>
    </BlogLayout>
  );
};
