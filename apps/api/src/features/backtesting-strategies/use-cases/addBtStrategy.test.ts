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
import { mockDateService, mockIdService } from '#test-utils/services.js';

import { isBtStrategyDomainError } from '../domain/btStrategy.error.js';
import { createBtStrategyRepoError, isBtStrategyRepoError } from '../repositories/btStrategy.error.js';
import { AddBtStrategyUseCaseData, AddBtStrategyUseCaseDeps, addBtStrategyUseCase } from './addBtStrategy.js';

function mockDeps(overrides?: Partial<AddBtStrategyUseCaseDeps>): AddBtStrategyUseCaseDeps {
  return {
    btStrategyRepo: mockBtStrategyRepo(),
    dateService: mockDateService(),
    idService: mockIdService(),
    ...overrides,
  };
}
function mockValidData(): AddBtStrategyUseCaseData {
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
    const idService = mockIdService({ generateBtStrategyId: jest.fn().mockReturnValue(randomString()) });
    const deps = mockDeps({ idService });

    await executeT(addBtStrategyUseCase(deps, mockValidData()));

    expect(idService.generateBtStrategyId).toHaveBeenCalledOnce();
  });
  it('THEN it should call get current date once', async () => {
    const dateService = mockDateService({ getCurrentDate: jest.fn().mockReturnValue(randomAnyDate()) });
    const deps = mockDeps({ dateService });

    await executeT(addBtStrategyUseCase(deps, mockValidData()));

    expect(dateService.getCurrentDate).toHaveBeenCalledOnce();
  });
  it('THEN it should call add backtesting strategy once', async () => {
    const btStrategyRepo = mockBtStrategyRepo({ add: jest.fn().mockImplementation((x) => te.right(x)) });
    const deps = mockDeps({ btStrategyRepo });

    await executeT(addBtStrategyUseCase(deps, mockValidData()));

    expect(btStrategyRepo.add).toHaveBeenCalledOnce();
  });
  it('THEN it should return Right of undefined', async () => {
    const id = randomString();
    const currentDate = randomAnyDate();
    const idService = mockIdService({ generateBtStrategyId: jest.fn().mockReturnValue(id) });
    const dateService = mockDateService({ getCurrentDate: jest.fn().mockReturnValue(currentDate) });
    const deps = mockDeps({ idService, dateService });
    const data = mockValidData();
    const result = await executeT(addBtStrategyUseCase(deps, data));

    expect(result).toEqualRight(undefined);
  });
});

describe('WHEN try to add a backtesting strategy with invalid data', () => {
  it('THEN it should return Left of error', async () => {
    const data = { ...mockValidData(), startTimestamp: new Date('invalid') };
    const result = await executeT(addBtStrategyUseCase(mockDeps(), data));

    expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyDomainError));
  });
});

describe('WHEN adding a backtesting strategy using repository fails', () => {
  it('THEN it should return Left of error', async () => {
    const error = createBtStrategyRepoError('AddBtStrategyError', 'Mock');
    const btStrategyRepo = mockBtStrategyRepo({ add: jest.fn().mockReturnValue(te.left(error)) });
    const deps = mockDeps({ btStrategyRepo });
    const result = await executeT(addBtStrategyUseCase(deps, mockValidData()));

    expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
  });
});
