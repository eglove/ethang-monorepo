import { Alert, Link } from "@heroui/react";

import { MainLayout } from "../../components/main-layout.tsx";
import { ReactivityTables } from "../../components/tips/reactivity/reactivity-tables.tsx";
import { TypographyH1 } from "../../components/typography/typography-h1.tsx";
import { TypographyList } from "../../components/typography/typography-list.tsx";
import { TypographyP } from "../../components/typography/typography-p.tsx";

const RouteComponent = () => {
  return (
    <MainLayout className="max-w-[65ch]">
      <TypographyH1>Find Grained React Renders</TypographyH1>
      <Alert
        description={
          <div>
            <TypographyP>
              Reactivity is a complex subject. React's architecture takes a hard
              opinion against fine-grained reactivity favoring the server side
              approaches taken at Meta with Relay and more recently with NextJS
              and RSC. This example is only meant to get as close as possible.
              You can read more about reactivity below:
            </TypographyP>
            <TypographyList>
              <li>
                <Link
                  isExternal
                  showAnchorIcon
                  className="text-foreground"
                  href="https://www.builder.io/blog/history-of-reactivity"
                >
                  A Brief History of Reactivity
                </Link>
              </li>
              <li>
                <Link
                  isExternal
                  showAnchorIcon
                  className="text-foreground"
                  href="https://dev.to/this-is-learning/derivations-in-reactivity-4fo1"
                >
                  Derivations in Reactivity
                </Link>
              </li>
              <li>
                <Link
                  isExternal
                  showAnchorIcon
                  className="text-foreground"
                  href="https://www.stefankrause.net/wp/2017/01/js-web-frameworks-benchmark-keyed-vs-non-keyed/"
                >
                  JS web frameworks benchmark: keyed vs. non-keyed
                </Link>
              </li>
            </TypographyList>
          </div>
        }
        className="my-4"
        color="warning"
        title="Fine Grained Reactivity In React Is Not Possible"
      />
      <ReactivityTables />
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
});
