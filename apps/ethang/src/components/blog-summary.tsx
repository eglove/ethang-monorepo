import { Button, Card, CardHeader, Link } from "@heroui/react";
import map from "lodash/map.js";
import slice from "lodash/slice";
import { NewspaperIcon } from "lucide-react";

import { blogs } from "../routes/blog.tsx";
import { TypographyH1 } from "./typography/typography-h1.tsx";
import { TypographyH2 } from "./typography/typography-h2.tsx";

const firstThreeBlogs = slice(blogs, 0, 3);

export const BlogSummary = () => {
  return (
    <div className="grid gap-4">
      <TypographyH1 className="flex items-center gap-2">
        <NewspaperIcon /> Blogs
      </TypographyH1>
      <div className="grid gap-4 md:grid-cols-3">
        {map(firstThreeBlogs, (blog) => {
          return (
            <a href={blog.href}>
              <Card className="h-full border-2">
                <CardHeader>
                  <TypographyH2 className="w-full border-b-0 p-0 text-center">
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
        className="border-1 border-white bg-black text-white"
        href="/blog"
      >
        View All Blogs
      </Button>
    </div>
  );
};
