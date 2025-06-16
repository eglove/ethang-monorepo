import find from "lodash/find";
import isNil from "lodash/isNil.js";
import random from "lodash/random";
import set from "lodash/set";
import { useEffect, useState } from "react";

import { numberFormatter } from "./data.ts";
import { positionsStore } from "./optimized-table.tsx";

type PriceComponentProperties = {
  symbol: string;
};

export const PriceComponent = ({
  symbol,
}: Readonly<PriceComponentProperties>) => {
  const [price, setPrice] = useState(Number.NaN);

  useEffect(() => {
    const interval = setInterval(() => {
      const _price = random(100, 500);
      setPrice(_price);
      const position = find(positionsStore, { symbol });

      if (!isNil(position)) {
        set(position, ["price"], _price);
      }
    }, 300);

    return () => {
      clearInterval(interval);
    };
  }, [symbol]);

  return (
    <div>{Number.isNaN(price) ? null : numberFormatter.format(price)}</div>
  );
};
