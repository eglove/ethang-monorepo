import {
  getKeyValue,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import map from "lodash/map";
import random from "lodash/random";
import toNumber from "lodash/toNumber";
import convertToString from "lodash/toString";
import { useEffect, useState } from "react";

import { columns, getPositions, numberFormatter } from "./data.ts";

export const UnoptimizedTable = () => {
  const [positions, setPositions] = useState(() => getPositions());

  // Simulate merging two endpoints, one to get portfolio positions, another to poll to get price, PnL is calculated at runtime
  useEffect(() => {
    const interval = setInterval(() => {
      const _positions = getPositions();
      const newPositions = map(_positions, (item) => {
        const newestPrice = random(100, 500);

        return {
          ...item,
          pnl: (newestPrice - item.entryPrice) * item.owned,
          price: newestPrice,
        };
      });

      setPositions(newPositions);
    }, 300);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // HeroUI Table's are "highly optimized", automatically caching each item. This does NOT stop rerenders!
  // https://www.heroui.com/docs/components/table#why-not-array-map
  return (
    <Table
      aria-label="Unoptimized Table"
      className="my-4"
      classNames={{ table: "table-fixed" }}
    >
      <TableHeader columns={columns}>
        {(column) => {
          return <TableColumn key={column.key}>{column.label}</TableColumn>;
        }}
      </TableHeader>
      <TableBody items={positions}>
        {(item) => {
          return (
            <TableRow key={item.symbol}>
              {(columnKey) => {
                const value = getKeyValue(item, columnKey) as unknown;

                if (
                  "entryPrice" === columnKey ||
                  "price" === columnKey ||
                  "pnl" === columnKey
                ) {
                  const number = toNumber(value);

                  return (
                    <TableCell>
                      {Number.isNaN(number)
                        ? null
                        : numberFormatter.format(toNumber(value))}
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
