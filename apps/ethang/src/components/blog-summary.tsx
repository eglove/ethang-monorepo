import { Button, Card, CardHeader, Link } from "@heroui/react";
import { NewspaperIcon } from "lucide-react";

import { TypographyH1 } from "./typography/typography-h1.tsx";
import { TypographyH2 } from "./typography/typography-h2.tsx";

export const BlogSummary = () => {
  return (
    <div className="grid gap-4">
      <TypographyH1 className="flex items-center gap-2">
        <NewspaperIcon /> Blogs
      </TypographyH1>
      <a href="/blog/how-i-code">
        <Card className="h-full border-2">
          <CardHeader>
            <TypographyH2 className="w-full border-b-0 p-0 text-center">
              How I Code
            </TypographyH2>
          </CardHeader>
        </Card>
      </a>
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
