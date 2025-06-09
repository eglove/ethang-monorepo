import get from "lodash/get.js";
import keys from "lodash/keys.js";
import random from "lodash/random.js";
import toInteger from "lodash/toInteger.js";

export const mockPrices: Record<string, number> = {};

export const generateInitialMockPrices = (symbols: string[]) => {
  for (const symbol of symbols) {
    mockPrices[symbol] = Number.parseFloat(random(1000, 1100).toFixed(2));
  }
};

export const simulatePriceUpdates = () => {
  for (const symbol of keys(mockPrices)) {
    const current = get(mockPrices, [symbol], 0);

    mockPrices[symbol] = Number.parseFloat(
      (current + random(-2.5, 2.5)).toFixed(2),
    );
  }
};

export const calculatePnL = (
  currentPrice: number,
  entryPrice: number,
  quantity: number,
) => {
  return (currentPrice - entryPrice) * quantity;
};

export const fetchPriceQuery = async (symbol: string): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(toInteger(mockPrices[symbol]));
    }, 10);
  });
};
