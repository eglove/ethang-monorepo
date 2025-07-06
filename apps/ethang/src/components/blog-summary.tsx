import { Button, Card, CardHeader, Link } from "@heroui/react";
import map from "lodash/map.js";
import slice from "lodash/slice.js";
import { NewspaperIcon } from "lucide-react";

import { blogs } from "../routes/blog.tsx";
import { TypographyH1 } from "./typography/typography-h1.tsx";
import { TypographyH2 } from "./typography/typography-h2.tsx";

const topThreeBlogs = slice(blogs, 0, 3);

export const BlogSummary = () => {
  return (
    <div className="grid gap-4">
      <TypographyH1 className="flex items-center gap-2">
        <NewspaperIcon /> Blogs
      </TypographyH1>
      <div className="grid sm:grid-cols-3 gap-4">
        {map(topThreeBlogs, (blog) => {
          return (
            <a href={blog.href} key={blog.label}>
              <Card className="border-2">
                <CardHeader>
                  <TypographyH2 className="p-0 border-b-0">
                    {blog.label}
                  </TypographyH2>
                </CardHeader>
              </Card>
            </a>
          );
        })}
      </div>
      <Button
        as={Link}
        className="bg-black text-white border-1 border-white"
        href="/blog"
      >
        View All Blogs
      </Button>
    </div>
  );
};
