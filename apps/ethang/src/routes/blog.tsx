import map from "lodash/map.js";

import { MainLayout } from "../components/main-layout.tsx";
import { TypographyH2 } from "../components/typography/typography-h2.tsx";

export const blogs = [
  {
    href: "/blog/software-engineers-data-brokers",
    label: "Software Engineers as Data Brokers: An Uncomfortable Truth",
  },
];

const RouteComponent = () => {
  return (
    <MainLayout>
      <div className="max-w-[65ch] mx-auto">
        {map(blogs, (blog) => {
          return (
            <a className="text-foreground" href={blog.href}>
              <TypographyH2 key={blog.label}>{blog.label}</TypographyH2>
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
