import type { PropsWithChildren } from "react";

import { Pagination, ScrollShadow } from "@heroui/react";
import isNil from "lodash/isNil.js";

type TableWrapperProperties = PropsWithChildren<{
  paginationProps?: Parameters<typeof Pagination>[0];
}>;

export const TableWrapper = ({
  children,
  paginationProps,
}: Readonly<TableWrapperProperties>) => {
  return (
    <div className="p-4 z-0 flex flex-col relative justify-between gap-4 bg-content1 overflow-auto rounded-large shadow-small w-full">
      <ScrollShadow orientation="horizontal" size={20}>
        {children}
      </ScrollShadow>
      {!isNil(paginationProps) && <Pagination {...paginationProps} />}
    </div>
  );
};
