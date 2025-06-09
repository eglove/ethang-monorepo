import { QueryClientProvider } from "@tanstack/react-query";
import map from "lodash/map.js";
import { useEffect, useState } from "react";

import { generateInitialMockPrices } from "../utilities/mocks.ts";
import { OptimizedTable } from "./optimized-table.tsx";
import { queryClient } from "./providers.tsx";

export const OptimizedApp = () => {
  // eslint-disable-next-line react/naming-convention/use-state
  const [positions] = useState([
    { entryPrice: 30_000, quantity: 0.5, symbol: "BTC" },
    { entryPrice: 2000, quantity: 2, symbol: "ETH" },
    { entryPrice: 0.5, quantity: 500, symbol: "ADA" },
  ]);

  useEffect(() => {
    generateInitialMockPrices(map(positions, (p) => p.symbol));
  }, [positions]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex-1 p-4">
        <OptimizedTable positions={positions} />
      </div>
    </QueryClientProvider>
  );
};
