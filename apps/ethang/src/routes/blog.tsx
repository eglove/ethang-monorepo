import map from "lodash/map.js";

import { MainLayout } from "../components/main-layout.tsx";
import { TypographyH1 } from "../components/typography/typography-h1.tsx";
import { TypographyH2 } from "../components/typography/typography-h2.tsx";

export const blogs = [
  {
    href: "/blog/how-i-code",
    label: "How I Code",
  },
  {
    href: "/blog/discipline-for-dopamine",
    label: "How an Industry Traded Discipline for Dopamine",
  },
  {
    // eslint-disable-next-line cspell/spellchecker
    href: "/blog/whered-the-team-go",
    label: "Where'd The Team Go?",
  },
  {
    href: "/blog/some-thoughts-on-ai",
    label: "Some Thoughts On The Way Things Are",
  },
  {
    href: "/blog/unicorn-60",
    label: "Unicorn 60",
  },
  {
    href: "/blog/react-compiler",
    label: "The React Compiler: A Critical Look at Performance Claims",
  },
  {
    href: "/blog/no-comments",
    label: "Why I Don't Allow Comments: Reclaiming Focus in a Noisy World",
  },
];

const RouteComponent = () => {
  return (
    <MainLayout className="max-w-[65ch]">
      <TypographyH1>Blog</TypographyH1>
      <div className="my-6 grid gap-4">
        {map(blogs, (blog) => {
          return (
            <a className="text-foreground" href={blog.href} key={blog.label}>
              <TypographyH2>{blog.label}</TypographyH2>
            </a>
          );
        })}
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
});
