import te from 'fp-ts/lib/TaskEither.js';

import { executeT } from '#shared/utils/fp.js';
import { randomExchangeName, randomLanguage, randomTimeframe } from '#test-utils/domain.js';
import {
  randomAnyDate,
  randomBeforeAndAfterDate,
  randomPositiveFloat,
  randomPositiveInt,
  randomString,
} from '#test-utils/faker.js';
import { mockBtStrategyRepo } from '#test-utils/features/btStrategies/repositories.js';
import { mockDateService } from '#test-utils/services.js';

import { isBtStrategyDomainError } from '../domain/btStrategy.error.js';
import { createBtStrategyRepoError, isBtStrategyRepoError } from '../repositories/btStrategy.error.js';
import {
  AddBtStrategyCommandData,
  AddBtStrategyCommandDeps,
  addBtStrategyCommand,
} from './addBtStrategyCommand.js';

function mockDeps(overrides?: Partial<AddBtStrategyCommandDeps>): AddBtStrategyCommandDeps {
  return { btStrategyRepo: mockBtStrategyRepo(), dateService: mockDateService(), ...overrides };
}
function mockValidData(): AddBtStrategyCommandData {
  const { before, after } = randomBeforeAndAfterDate();
  return {
    name: randomString(),
    exchange: randomExchangeName(),
    symbol: randomString(),
    currency: randomString(),
    timeframe: randomTimeframe(),
    maxNumKlines: randomPositiveInt(),
    initialCapital: randomPositiveFloat(),
    takerFeeRate: randomPositiveFloat(),
    makerFeeRate: randomPositiveFloat(),
    startTimestamp: before,
    endTimestamp: after,
    language: randomLanguage(),
    body: randomString(),
  };
}

describe('WHEN successfully add a backtesting strategy', () => {
  it('THEN it should call generate backtesting strategy id once', async () => {
    const btStrategyRepo = mockBtStrategyRepo({ generateId: jest.fn().mockReturnValue(randomString()) });
    const deps = mockDeps({ btStrategyRepo });

    await executeT(addBtStrategyCommand(deps, mockValidData()));

    expect(btStrategyRepo.generateId).toHaveBeenCalledOnce();
  });
  it('THEN it should call get current date once', async () => {
    const dateService = mockDateService({ getCurrentDate: jest.fn().mockReturnValue(randomAnyDate()) });
    const deps = mockDeps({ dateService });

    await executeT(addBtStrategyCommand(deps, mockValidData()));

    expect(dateService.getCurrentDate).toHaveBeenCalledOnce();
  });
  it('THEN it should call add backtesting strategy once', async () => {
    const btStrategyRepo = mockBtStrategyRepo({ add: jest.fn().mockImplementation((x) => te.right(x)) });
    const deps = mockDeps({ btStrategyRepo });

    await executeT(addBtStrategyCommand(deps, mockValidData()));

    expect(btStrategyRepo.add).toHaveBeenCalledOnce();
  });
  it('THEN it should return Right of created id and timestamp', async () => {
    const id = randomString();
    const btStrategyRepo = mockBtStrategyRepo({ generateId: jest.fn().mockReturnValue(id) });
    const currentDate = randomAnyDate();
    const dateService = mockDateService({ getCurrentDate: jest.fn().mockReturnValue(currentDate) });
    const deps = mockDeps({ dateService, btStrategyRepo });
    const data = mockValidData();
    const result = await executeT(addBtStrategyCommand(deps, data));

    expect(result).toEqualRight({ id, createdAt: currentDate });
  });
});

describe('WHEN try to add a backtesting strategy with invalid data', () => {
  it('THEN it should return Left of error', async () => {
    const data = { ...mockValidData(), startTimestamp: new Date('invalid') };
    const result = await executeT(addBtStrategyCommand(mockDeps(), data));

    expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyDomainError));
  });
});

describe('WHEN adding a backtesting strategy using repository fails', () => {
  it('THEN it should return Left of error', async () => {
    const error = createBtStrategyRepoError('AddBtStrategyError', 'Mock');
    const btStrategyRepo = mockBtStrategyRepo({ add: jest.fn().mockReturnValue(te.left(error)) });
    const deps = mockDeps({ btStrategyRepo });
    const result = await executeT(addBtStrategyCommand(deps, mockValidData()));

    expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
  });
});
