import type { PropsWithChildren, ReactNode } from "react";

import { ScrollShadow } from "@heroui/react";

type TableBaseComponentProperties = PropsWithChildren<{
  bottomContent?: ReactNode;
}>;

export const TableBaseComponent = ({
  bottomContent,
  children,
}: Readonly<TableBaseComponentProperties>) => {
  return (
    <div className="p-4 z-0 flex flex-col relative justify-between gap-4 bg-content1 overflow-auto rounded-large shadow-small w-full">
      <ScrollShadow orientation="horizontal" size={20}>
        {children}
      </ScrollShadow>
      {bottomContent}
    </div>
  );
};
