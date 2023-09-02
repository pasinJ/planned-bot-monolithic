import * as te from 'fp-ts/lib/TaskEither';

import { BtStrategyRepo } from '#features/backtesting-strategies/repositories/btStrategy.type';

export function mockBtStrategyRepo(overrides?: Partial<BtStrategyRepo>): BtStrategyRepo {
  return { getBtStrategies: te.right([]), addBtStrategy: () => te.right(undefined), ...overrides };
}
