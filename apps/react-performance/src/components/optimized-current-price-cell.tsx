import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { fetchPriceQuery, mockPrices } from "../utilities/mocks.ts";
import { queryClient } from "./providers.tsx";

type OptimizedCurrentPriceCellProperties = {
  symbol: string;
};

export const OptimizedCurrentPriceCell = ({
  symbol,
}: Readonly<OptimizedCurrentPriceCellProperties>) => {
  const {
    data: price,
    isError,
    isLoading,
  } = useQuery({
    queryFn: async () => fetchPriceQuery(symbol),
    queryKey: ["price", symbol],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.setQueryData(["price", symbol], mockPrices[symbol]);
    }, 200);
    return () => {
      clearInterval(interval);
    };
  }, [symbol]);

  if (isLoading)
    return (
      <td className="p-2 border-b border-gray-700 text-right text-gray-500">
        Loading...
      </td>
    );
  if (isError)
    return (
      <td className="p-2 border-b border-gray-700 text-right text-red-500">
        Error
      </td>
    );
  if (price === undefined)
    return (
      <td className="p-2 border-b border-gray-700 text-right text-gray-500">
        N/A
      </td>
    );

  return (
    <td
      className="p-2 border-b border-gray-700 text-right" // Add class for animation
    >
      {price.toFixed(2)}
    </td>
  );
};
