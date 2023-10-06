import { ClosedTrade, OpeningTrade } from '../trade.js';

export type TradesModule = {
  /** List of current opening trades */
  openingTrades: readonly OpeningTrade[];
  /** List of current closed trades */
  closedTrades: readonly ClosedTrade[];
  /** List of current breakeven closed trades */
  evenTrades: readonly ClosedTrade[];
  /** List of current unprofitable closed trades */
  lossTrades: readonly ClosedTrade[];
  /** List of current profitable closed trades */
  winTrades: readonly ClosedTrade[];
};
