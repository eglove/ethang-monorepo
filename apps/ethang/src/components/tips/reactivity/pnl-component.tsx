import find from "lodash/find";
import get from "lodash/get";
import isNil from "lodash/isNil.js";
import set from "lodash/set";
import { useEffect, useState } from "react";

import { numberFormatter } from "./data.ts";
import { positionsStore } from "./optimized-table.tsx";

type PnlComponent = {
  symbol: string;
};

export const PnlComponent = ({ symbol }: Readonly<PnlComponent>) => {
  const [pnl, setPnl] = useState(Number.NaN);

  useEffect(() => {
    const interval = setInterval(() => {
      const position = find(positionsStore, { symbol });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const price = get(position, ["price"]) as unknown as number | undefined;

      if (!isNil(position) && !isNil(price)) {
        const _pnl = (price - position.entryPrice) * position.owned;
        setPnl(_pnl);
        set(position, ["pnl"], _pnl);
      }
    }, 300);

    return () => {
      clearInterval(interval);
    };
  }, [symbol]);

  return <div>{Number.isNaN(pnl) ? null : numberFormatter.format(pnl)}</div>;
};
