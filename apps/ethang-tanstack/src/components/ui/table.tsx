import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";

const Table = forwardRef<
  Readonly<HTMLTableElement>,
  Readonly<HTMLAttributes<HTMLTableElement>>
>(({ className, ...properties }, reference) => {
  return (
    <div className="relative w-full overflow-auto">
      {/* eslint-disable-next-line sonar/table-header */}
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        ref={reference}
        {...properties}
      />
    </div>
  );
});
Table.displayName = "Table";

const TableHeader = forwardRef<
  Readonly<HTMLTableSectionElement>,
  Readonly<HTMLAttributes<HTMLTableSectionElement>>
>(({ className, ...properties }, reference) => {
  return (
    <thead
      className={cn("[&_tr]:border-b", className)}
      ref={reference}
      {...properties}
    />
  );
});
TableHeader.displayName = "TableHeader";

const TableBody = forwardRef<
  Readonly<HTMLTableSectionElement>,
  Readonly<HTMLAttributes<HTMLTableSectionElement>>
>(({ className, ...properties }, reference) => {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0", className)}
      ref={reference}
      {...properties}
    />
  );
});
TableBody.displayName = "TableBody";

const TableFooter = forwardRef<
  Readonly<HTMLTableSectionElement>,
  Readonly<HTMLAttributes<HTMLTableSectionElement>>
>(({ className, ...properties }, reference) => {
  return (
    <tfoot
      className={cn(
        "border-t bg-neutral-100/50 font-medium [&>tr]:last:border-b-0 dark:bg-neutral-800/50",
        className,
      )}
      ref={reference}
      {...properties}
    />
  );
});
TableFooter.displayName = "TableFooter";

const TableRow = forwardRef<
  Readonly<HTMLTableRowElement>,
  Readonly<HTMLAttributes<HTMLTableRowElement>>
>(({ className, ...properties }, reference) => {
  return (
    <tr
      className={cn(
        "border-b transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800",
        className,
      )}
      ref={reference}
      {...properties}
    />
  );
});
TableRow.displayName = "TableRow";

const TableHead = forwardRef<
  Readonly<HTMLTableCellElement>,
  Readonly<ThHTMLAttributes<HTMLTableCellElement>>
>(({ className, ...properties }, reference) => {
  return (
    <th
      className={cn(
        "h-10 px-2 text-left align-middle font-medium text-neutral-500 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] dark:text-neutral-400",
        className,
      )}
      ref={reference}
      {...properties}
    />
  );
});
TableHead.displayName = "TableHead";

const TableCell = forwardRef<
  Readonly<HTMLTableCellElement>,
  Readonly<TdHTMLAttributes<HTMLTableCellElement>>
>(({ className, ...properties }, reference) => {
  return (
    <td
      className={cn(
        "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      ref={reference}
      {...properties}
    />
  );
});
TableCell.displayName = "TableCell";

const TableCaption = forwardRef<
  Readonly<HTMLTableCaptionElement>,
  Readonly<HTMLAttributes<HTMLTableCaptionElement>>
>(({ className, ...properties }, reference) => {
  return (
    <caption
      className={cn("mt-4 text-sm text-neutral-500 dark:text-neutral-400", className)}
      ref={reference}
      {...properties}
    />
  );
});
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
