import isNil from "lodash/isNil.js";

import type { TableRowData } from "../types/types.ts";

import { TraditionalPlCell } from "./traditional-pl-cell.tsx";

export const TraditionalTableRow = ({
  position,
  prices,
}: Readonly<TableRowData>) => {
  const price = prices[position.symbol];

  return (
    <tr>
      <td className="p-2 border-b border-gray-700 font-medium">
        {position.symbol}
      </td>
      <td className="p-2 border-b border-gray-700 text-right">
        {position.quantity}
      </td>
      <td className="p-2 border-b border-gray-700 text-right">
        {position.entryPrice.toFixed(2)}
      </td>
      <td className="p-2 border-b border-gray-700 text-right">
        {isNil(price) ? "N/A" : price.toFixed(2)}
      </td>
      <TraditionalPlCell position={position} price={price} />
    </tr>
  );
};
