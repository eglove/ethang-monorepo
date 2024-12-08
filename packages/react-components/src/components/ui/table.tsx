import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

const Table = ({
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLTableElement>>) => {
  return (
    <div className="relative w-full overflow-auto">
      {/* eslint-disable-next-line sonar/table-header */}
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...properties}
      />
    </div>
  );
};
Table.displayName = "Table";

const TableHeader = ({
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLTableSectionElement>>) => {
  return (
    <thead
      className={cn("[&_tr]:border-b", className)}
      {...properties}
    />
  );
};
TableHeader.displayName = "TableHeader";

const TableBody = ({
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLTableSectionElement>>) => {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0", className)}
      {...properties}
    />
  );
};
TableBody.displayName = "TableBody";

const TableFooter = ({
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLTableSectionElement>>) => {
  return (
    <tfoot
      className={
        cn(
          "border-t bg-neutral-100/50 font-medium [&>tr]:last:border-b-0 dark:bg-neutral-800/50",
          className,
        )
      }
      {...properties}
    />
  );
};
TableFooter.displayName = "TableFooter";

const TableRow = ({
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLTableRowElement>>) => {
  return (
    <tr
      className={
        cn(
          "border-b transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800",
          className,
        )
      }
      {...properties}
    />
  );
};
TableRow.displayName = "TableRow";

const TableHead = ({
  className,
  ...properties
}: Readonly<ThHTMLAttributes<HTMLTableCellElement>>) => {
  return (
    <th
      className={
        cn(
          "h-10 px-2 text-left align-middle font-medium text-neutral-500 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] dark:text-neutral-400",
          className,
        )
      }
      {...properties}
    />
  );
};
TableHead.displayName = "TableHead";

const TableCell = ({
  className,
  ...properties
}: Readonly<TdHTMLAttributes<HTMLTableCellElement>>) => {
  return (
    <td
      className={
        cn(
          "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
          className,
        )
      }
      {...properties}
    />
  );
};
TableCell.displayName = "TableCell";

const TableCaption = ({
  className,
  ...properties
}: Readonly<HTMLAttributes<HTMLTableCaptionElement>>) => {
  return (
    <caption
      className={cn("mt-4 text-sm text-neutral-500 dark:text-neutral-400", className)}
      {...properties}
    />
  );
};
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
