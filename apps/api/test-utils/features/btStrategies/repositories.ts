import te from 'fp-ts/lib/TaskEither.js';

import { BtStrategyRepo } from '#features/backtesting-strategies/btStrategy.repository.type.js';

export function mockBtStrategyRepo(overrides?: Partial<BtStrategyRepo>): BtStrategyRepo {
  return { add: () => te.right(undefined), ...overrides };
}
