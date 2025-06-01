import type { PropsWithChildren } from "react";

import { ScrollShadow } from "@heroui/react";

type TableBaseComponentProperties = PropsWithChildren;

export const TableBaseComponent = ({
  children,
}: Readonly<TableBaseComponentProperties>) => {
  return (
    <ScrollShadow
      className="p-4 z-0 flex flex-col relative justify-between gap-4 bg-content1 overflow-auto rounded-large shadow-small w-full"
      orientation="horizontal"
      size={20}
    >
      {children}
    </ScrollShadow>
  );
};
