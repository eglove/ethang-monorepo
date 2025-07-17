import {
  getKeyValue,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import isNumber from "lodash/isNumber.js";

type AppearanceCountTableProperties = {
  bucketPulls: number | undefined;
  goldenTicketCashIns: number | undefined;
  guests: number | undefined;
  regulars: number | undefined;
  total: number;
};

export const AppearanceCountTable = ({
  bucketPulls,
  goldenTicketCashIns,
  guests,
  regulars,
  total,
}: Readonly<AppearanceCountTableProperties>) => {
  const columns: { key: string; label: string }[] = [];

  if (isNumber(guests) && 0 < guests) {
    columns.push({ key: "guests", label: "Guest Appearances" });
  }

  if (isNumber(regulars) && 0 < regulars) {
    columns.push({ key: "regulars", label: "Regular Appearances" });
  }

  if (isNumber(goldenTicketCashIns) && 0 < goldenTicketCashIns) {
    columns.push({
      key: "goldenTicketCashIns",
      label: "Golden Ticket Cash Ins",
    });
  }

  if (isNumber(bucketPulls) && 0 < bucketPulls) {
    columns.push({ key: "bucketPulls", label: "Pulled from bucket" });
  }

  if (isNumber(total) && 0 < total) {
    columns.push({ key: "total", label: "Total Appearances" });
  }

  const rows = [
    {
      bucketPulls,
      goldenTicketCashIns,
      guests,
      key: "appearances",
      regulars,
      total,
    },
  ];

  return (
    <Table
      aria-label="Appearance Counts"
      className="mx-auto w-full md:w-5/6 lg:w-1/2"
    >
      <TableHeader columns={columns}>
        {(column) => {
          return <TableColumn key={column.key}>{column.label}</TableColumn>;
        }}
      </TableHeader>
      <TableBody items={rows}>
        {(item) => (
          <TableRow key={item.key}>
            {(columnKey) => (
              <TableCell>{getKeyValue(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
