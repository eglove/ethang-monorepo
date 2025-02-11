import type { ReferenceProperties } from "@/types/reference.ts";
import type { RefObject, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const Table = ({
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLTableElement>) => (
  <div className="relative w-full overflow-auto">
    {/* eslint-disable-next-line sonar/table-header */}
    <table
      className={cn("w-full caption-bottom text-sm", className)}
      ref={ref}
      {...properties}
    />
  </div>
);
Table.displayName = "Table";

const TableHeader = ({
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLTableSectionElement>) => (
  <thead
    className={cn("[&_tr]:border-b", className)}
    ref={ref}
    {...properties}
  />
);
TableHeader.displayName = "TableHeader";

const TableBody = ({
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLTableSectionElement>) => (
  <tbody
    className={cn("[&_tr:last-child]:border-0", className)}
    ref={ref}
    {...properties}
  />
);
TableBody.displayName = "TableBody";

const TableFooter = ({
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLTableSectionElement>) => (
  <tfoot
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className,
    )}
    ref={ref}
    {...properties}
  />
);
TableFooter.displayName = "TableFooter";

const TableRow = ({
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLTableRowElement>) => (
  <tr
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className,
    )}
    ref={ref}
    {...properties}
  />
);
TableRow.displayName = "TableRow";

type TableHeadProperties = Readonly<
  {
    ref?: RefObject<HTMLTableCellElement | null>;
  } & ThHTMLAttributes<HTMLTableCellElement>
>;

const TableHead = ({ className, ref, ...properties }: TableHeadProperties) => (
  <th
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className,
    )}
    ref={ref}
    {...properties}
  />
);
TableHead.displayName = "TableHead";

type TableCellProperties = Readonly<
  {
    ref?: RefObject<HTMLTableCellElement | null>;
  } & TdHTMLAttributes<HTMLTableCellElement>
>;

const TableCell = ({ className, ref, ...properties }: TableCellProperties) => (
  <td
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    ref={ref}
    {...properties}
  />
);
TableCell.displayName = "TableCell";

const TableCaption = ({
  className,
  ref,
  ...properties
}: ReferenceProperties<HTMLTableCaptionElement>) => (
  <caption
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    ref={ref}
    {...properties}
  />
);
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
