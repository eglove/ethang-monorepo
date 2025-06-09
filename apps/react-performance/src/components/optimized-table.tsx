import map from "lodash/map.js";

import type { Position } from "../types/types.ts";

import { OptimizedTableRow } from "./optimized-table-row.tsx";

type OptimizedTableProperties = {
  positions: Position[];
};

export const OptimizedTable = ({
  positions,
}: Readonly<OptimizedTableProperties>) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-gray-100">
        Optimized ID Lookup with Simulated Cache
      </h3>
      <p className="text-gray-400 mb-4 text-sm">
        Only individual cells (specifically those displaying current price or
        P&L) re-render on price updates, not entire rows or the table.
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
          {map(positions, (position) => (
            <OptimizedTableRow key={position.symbol} position={position} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
