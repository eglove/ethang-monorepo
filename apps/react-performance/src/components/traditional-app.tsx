import map from "lodash/map.js";
import { useEffect, useState } from "react";

import {
  generateInitialMockPrices,
  mockPrices,
  simulatePriceUpdates,
} from "../utilities/mocks.ts";
import { TraditionalTable } from "./traditional-table.tsx";

export const TraditionalApp = () => {
  // eslint-disable-next-line react/naming-convention/use-state
  const [positions] = useState([
    { entryPrice: 30_000, quantity: 0.5, symbol: "BTC" },
    { entryPrice: 2000, quantity: 2, symbol: "ETH" },
    { entryPrice: 0.5, quantity: 500, symbol: "ADA" },
  ]);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    generateInitialMockPrices(map(positions, (p) => p.symbol));
    const intervalId = setInterval(() => {
      simulatePriceUpdates();
      setPrices({ ...mockPrices });
    }, 200);
    return () => {
      clearInterval(intervalId);
    };
  }, [positions]);

  return (
    <div className="flex-1 p-4">
      <TraditionalTable positions={positions} prices={prices} />
    </div>
  );
};
