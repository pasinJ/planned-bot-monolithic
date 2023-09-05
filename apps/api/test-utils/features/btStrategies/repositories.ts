import te from 'fp-ts/lib/TaskEither.js';

import { BtStrategyRepo } from '#features/backtesting-strategies/repositories/btStrategy.type.js';

export function mockBtStrategyRepo(overrides?: Partial<BtStrategyRepo>): BtStrategyRepo {
  return { add: () => te.right(undefined), ...overrides };
}
