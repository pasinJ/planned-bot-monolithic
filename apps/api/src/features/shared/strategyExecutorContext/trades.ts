import type { TradesModule } from '#SECT/TradesModule.js';

import { ClosedTrade, OpeningTrade } from '../trade.js';

export type { TradesModule } from '#SECT/TradesModule.js';

export function buildTradesModules(
  openingTrades: readonly OpeningTrade[],
  closedTrades: readonly ClosedTrade[],
): TradesModule {
  return {
    openingTrades,
    closedTrades,
    evenTrades: closedTrades.filter((trade) => trade.netReturn === 0),
    winTrades: closedTrades.filter((trade) => trade.netReturn > 0),
    lossTrades: closedTrades.filter((trade) => trade.netReturn < 0),
  };
}
