import type { ReactNode } from "react";

import { cn } from "@/lib/utils.ts";
import map from "lodash/map";

type TypographyListProperties = {
  className?: string;
  items?: ReactNode[];
};

export const TypographyList = ({
  className, items,
}: Readonly<TypographyListProperties>) => {
  return (
    <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
      {map(items, (item, key) => {
        return (
          <li key={key}>
            {item}
          </li>
        );
      })}
    </ul>
  );
};
