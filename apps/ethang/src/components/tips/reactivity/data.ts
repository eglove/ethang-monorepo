export const columns = [
  { key: "symbol", label: "Symbol" },
  { key: "owned", label: "Owned" },
  { key: "entryPrice", label: "Entry Price" },
  { key: "price", label: "Price" },
  { key: "pnl", label: "PnL" },
];

export const getPositions = () => {
  return [
    { entryPrice: 170.25, owned: 150, symbol: "AAPL" },
    { entryPrice: 120, owned: 75, symbol: "GOOGL" },
    { entryPrice: 280.5, owned: 100, symbol: "MSFT" },
    { entryPrice: 105.75, owned: 50, symbol: "AMZN" },
    { entryPrice: 200, owned: 30, symbol: "TSLA" },
    { entryPrice: 450, owned: 80, symbol: "NVDA" },
    { entryPrice: 270.1, owned: 120, symbol: "META" },
    { entryPrice: 140, owned: 200, symbol: "JPM" },
    { entryPrice: 230.5, owned: 90, symbol: "V" },
    { entryPrice: 155, owned: 180, symbol: "PG" },
  ];
};

export const numberFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});
