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
    <div className="bg-content1 rounded-large shadow-small relative z-0 flex w-full flex-col justify-between gap-4 overflow-auto p-4">
      <ScrollShadow orientation="horizontal" size={20}>
        {children}
      </ScrollShadow>
      {!isNil(paginationProps) && <Pagination {...paginationProps} />}
    </div>
  );
};
