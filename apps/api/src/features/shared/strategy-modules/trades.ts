export type TradesModule = {
  openTrades: readonly OpenTrade[]; // Number of market position entries, which were not closed and remain opened.
  closedTrades: readonly ClosedTrade[]; // Number of closed trades for the whole trading interval.
  evenTrades: readonly ClosedTrade[]; // Number of breakeven trades for the whole trading interval.
  lossTrades: readonly ClosedTrade[]; // Number of unprofitable trades for the whole trading interval.
  winTrades: readonly ClosedTrade[]; // Number of profitable trades for the whole trading interval.
};

export type Trade = OpenTrade | ClosedTrade;

// open trade = number of entry that are not closed
export type OpenTrade = {
  id: string;
  entryId: string;
  entryPrice: number;
  entryTime: Date;
  fee: number;
  maxDrawDown: number; //  the maximum possible loss during the trade.
  maxRunup: number; //  the maximum possible profit during the trade.
};

export type ClosedTrade = {
  id: string;
  entryId: string;
  entryPrice: number;
  entryTime: Date;
  exitId: string;
  exitPrice: number;
  exitTime: Date;
  fee: number;
  maxDrawDown: number; //  the maximum possible loss during the trade.
  maxRunup: number; //  the maximum possible profit during the trade.
  profit: number; // Returns the profit/loss (Losses are expressed as negative values.)
};
