import {
  getKeyValue,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import toNumber from "lodash/toNumber";
import convertToString from "lodash/toString";

import { columns, getPositions, numberFormatter } from "./data.ts";
import { PnlComponent } from "./pnl-component.tsx";
import { PriceComponent } from "./price-component.tsx";

// In this case we assume positions is pulling from an external store such as React Query
// The component would not be notified unless data changes. (In this case it doesn't.)
export const positionsStore = getPositions();

export const OptimizedTable = () => {
  return (
    <Table
      className="my-4"
      aria-label="Unoptimized Table"
      classNames={{ table: "table-fixed" }}
    >
      <TableHeader columns={columns}>
        {(column) => {
          return <TableColumn key={column.key}>{column.label}</TableColumn>;
        }}
      </TableHeader>
      <TableBody items={positionsStore}>
        {(item) => {
          return (
            <TableRow key={item.symbol}>
              {(columnKey) => {
                const value = getKeyValue(item, columnKey) as unknown;

                if ("entryPrice" === columnKey) {
                  const number = toNumber(value);

                  return (
                    <TableCell>
                      {Number.isNaN(number)
                        ? null
                        : numberFormatter.format(toNumber(value))}
                    </TableCell>
                  );
                }

                if ("price" === columnKey) {
                  return (
                    <TableCell>
                      <PriceComponent symbol={item.symbol} />
                    </TableCell>
                  );
                }

                if ("pnl" === columnKey) {
                  return (
                    <TableCell>
                      <PnlComponent symbol={item.symbol} />
                    </TableCell>
                  );
                }

                return <TableCell>{convertToString(value)}</TableCell>;
              }}
            </TableRow>
          );
        }}
      </TableBody>
    </Table>
  );
};
