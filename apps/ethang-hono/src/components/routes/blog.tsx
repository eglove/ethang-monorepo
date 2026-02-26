import { BlogLayout } from "../layouts/blog-layout.tsx";
import { H1 } from "../typography/h1.tsx";
import { H2 } from "../typography/h2.tsx";
import { Link } from "../typography/link.tsx";
import { P } from "../typography/p.tsx";
import { wtfIsVinextPublished } from "./blog/wtf-is-vinext.tsx";

export const Blog = async () => {
  return (
    <BlogLayout title="Blog" description="Ethan Glover's blog.">
      <H1>Blog</H1>
      <div class="my-6">
        <H2>
          <Link href="/blog/wtf-is-vinext">WTF is vinext?</Link>
        </H2>
        <P className="m-0 text-sm">
          {wtfIsVinextPublished.toLocaleString(undefined, {
            dateStyle: "medium",
          })}
        </P>
      </div>
    </BlogLayout>
  );
};
