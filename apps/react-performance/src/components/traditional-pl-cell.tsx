import isNil from "lodash/isNil.js";

import type { TableCellData } from "../types/types.ts";

export const TraditionalPlCell = ({
  position,
  price,
}: Readonly<TableCellData>) => {
  const pnl = isNil(price)
    ? 0
    : (price - position.entryPrice) * position.quantity;

  return (
    <td className="p-2 border-b border-gray-700 text-right">
      {pnl.toFixed(2)}
    </td>
  );
};
