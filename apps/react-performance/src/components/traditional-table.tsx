import map from "lodash/map.js";
import { useRef } from "react";

import type { TableData } from "../types/types.ts";

import { TraditionalTableRow } from "./traditional-table-row.tsx";

export const TraditionalTable = ({
  positions,
  prices,
}: Readonly<TableData>) => {
  const reference = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg" ref={reference}>
      <h3 className="text-xl font-semibold mb-4 text-gray-100">
        Traditional Prop Drilling
      </h3>
      <p className="text-gray-400 mb-4 text-sm">
        The entire table and its rows often re-render on price updates, even if
        only one cell's data changes.{" "}
        <strong>
          Note that optimizing table rows and cells WOULD NOT stop any
          rerenders. As the array of data that acts as the source is a new
          reference on every render.
        </strong>{" "}
        I have not memoized these cells so that renders can still be highlighted
        on non-anonymous components in a production build.
      </p>
      <table className="min-w-full bg-gray-900 text-gray-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-700">
            <th className="p-2 text-left">Symbol</th>
            <th className="p-2 text-right">Quantity</th>
            <th className="p-2 text-right">Entry Price</th>
            <th className="p-2 text-right">Current Price</th>
            <th className="p-2 text-right">P&L</th>
          </tr>
        </thead>
        <tbody>
          {map(positions, (position) => {
            return (
              <TraditionalTableRow
                key={position.symbol}
                position={position}
                prices={prices}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
