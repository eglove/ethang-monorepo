import { Link } from "@heroui/react";

import { TypographyH2 } from "../../typography/typography-h2.tsx";
import { TypographyP } from "../../typography/typography-p.tsx";
import { OptimizedTable } from "./optimized-table.tsx";
import { UnoptimizedTable } from "./unoptimized-table.tsx";

export const ReactivityTables = () => {
  return (
    <>
      <TypographyH2>Unoptimized (Prop Drilling + Memoization)</TypographyH2>
      <TypographyP>
        This "unoptimized" example simulates the traditional approach of
        fetching/polling data from multiple endpoints, transforming the data,
        and creating an array of "table rows".
      </TypographyP>
      <TypographyP>
        Even with memoization of the data or components, this will still cause
        rerenders because on each data update, the table is getting a new array
        of table rows.
      </TypographyP>
      <TypographyP>
        This example uses HeroUI which caches results to{" "}
        <Link
          isExternal
          showAnchorIcon
          underline="always"
          className="text-foreground"
          href="https://www.heroui.com/docs/components/table#why-not-array-map"
        >
          "avoid re-rendering"
        </Link>
        . If you open React DevTools in your browser and turn on "Highlight
        updates when components render," you'll see this doesn't actually work.
      </TypographyP>
      <TypographyP>
        <Link
          isExternal
          showAnchorIcon
          underline="always"
          className="text-foreground"
          href="https://github.com/eglove/ethang-monorepo/blob/master/apps/ethang/src/components/tips/reactivity/unoptimized-table.tsx"
        >
          Read the code
        </Link>
      </TypographyP>
      <UnoptimizedTable />
      <TypographyH2>Optimized (Cache Lookup)</TypographyH2>
      <TypographyP>
        In this example, instead of transforming all data at the top level, the
        individual components lookup or fetch their own data based on a "stable
        value" from the table. In this case the symbol.
      </TypographyP>
      <TypographyP>
        <Link
          isExternal
          showAnchorIcon
          underline="always"
          className="text-foreground"
          href="https://github.com/eglove/ethang-monorepo/blob/master/apps/ethang/src/components/tips/reactivity/optimized-table.tsx"
        >
          Read the code
        </Link>
      </TypographyP>
      <OptimizedTable />
    </>
  );
};
