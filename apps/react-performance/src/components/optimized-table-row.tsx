import type { Position } from "../types/types.ts";

import { OptimizedCurrentPriceCell } from "./optimized-current-price-cell.tsx";
import { OptimizedPLCell } from "./optimized-pl-cell.tsx";

type OptimizedTableRow = {
  position: Position;
};

export const OptimizedTableRow = ({
  position,
}: Readonly<OptimizedTableRow>) => {
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
      <OptimizedCurrentPriceCell symbol={position.symbol} />
      <OptimizedPLCell
        entryPrice={position.entryPrice}
        quantity={position.quantity}
        symbol={position.symbol}
      />
    </tr>
  );
};
