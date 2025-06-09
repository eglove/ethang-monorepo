export type Position = {
  entryPrice: number;
  quantity: number;
  symbol: string;
};

export type TableCellData = {
  position: Position;
  price: number | undefined;
};

export type TableData = {
  positions: Position[];
  prices: Record<string, number>;
};

export type TableRowData = {
  position: Position;
  prices: Record<string, number>;
};
