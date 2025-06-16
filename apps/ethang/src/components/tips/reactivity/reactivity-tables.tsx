import { useEffect } from "react";

import { TypographyH2 } from "../../typography/typography-h2.tsx";
import { TypographyP } from "../../typography/typography-p.tsx";
import { OptimizedTable } from "./optimized-table.tsx";
import { UnoptimizedTable } from "./unoptimized-table.tsx";

export const ReactivityTables = () => {
  useEffect(() => {
    const script = globalThis.document.createElement("script");
    script.src = "//unpkg.com/react-scan/dist/auto.global.js";
    script.async = true;
    // @ts-expect-error allow
    document.body.append(script);
  }, []);

  return (
    <>
      <TypographyH2>Unoptimized (Prop Drilling + Memoization)</TypographyH2>
      <TypographyP>
        This "unoptimized" example simulates the traditional approach of
        fetching/polling data from the endpoints, transforming the data, and
        create an array of "table rows".
      </TypographyP>
      <TypographyP>
        Even with memoization of the data or components, this will still cause
        rerenders because on each data update, the table is getting a brand new
        array of table rows.
      </TypographyP>
      <UnoptimizedTable />
      <TypographyH2>Optimized (Cache Lookup)</TypographyH2>
      <TypographyP>
        In this example, instead of transforming all data at the top level, the
        individual components lookup or fetch their own data based on a "stable
        value" from the table. In this case the symbol.
      </TypographyP>
      <OptimizedTable />
    </>
  );
};
