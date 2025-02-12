import type { PropsWithChildren } from "react";

import { ChevronDownIcon, ChevronUpIcon, MinusIcon } from "lucide-react";

type SortButtonProperties = Readonly<
  PropsWithChildren<{
    isSorted: "asc" | "desc" | false;
    sortHandler: ((event: unknown) => void) | undefined;
  }>
>;

export const SortButton = ({
  children,
  isSorted,
  sortHandler,
}: SortButtonProperties) => {
  return (
    <button
      className="flex items-center gap-1"
      onClick={sortHandler}
      type="button"
    >
      {children} {false === isSorted && <MinusIcon />}
      {"asc" === isSorted && <ChevronUpIcon />}
      {"desc" === isSorted && <ChevronDownIcon />}
    </button>
  );
};
