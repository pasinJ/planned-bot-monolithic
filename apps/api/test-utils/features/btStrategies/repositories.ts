import te from 'fp-ts/lib/TaskEither.js';

import { BtStrategyRepo } from '#features/backtesting-strategies/repositories/btStrategy.type.js';
import { randomString } from '#test-utils/faker.js';

export function mockBtStrategyRepo(overrides?: Partial<BtStrategyRepo>): BtStrategyRepo {
  return { generateId: () => randomString(), add: () => te.right(undefined), ...overrides } as BtStrategyRepo;
}
