import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';

import { createSymbolDaoError, isSymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { isGeneralError } from '#shared/errors/generalError.js';
import { DeepPartial } from '#shared/helpers.type.js';
import { executeT } from '#shared/utils/fp.js';
import { randomExchangeName, randomLanguage, randomTimeframe } from '#test-utils/domain.js';
import {
  randomAnyDate,
  randomBeforeAndAfterDate,
  randomPositiveFloat,
  randomPositiveInt,
  randomString,
} from '#test-utils/faker.js';

import { createBtStrategyDaoError, isBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { AddBtStrategyDeps, AddBtStrategyRequest, addBtStrategy } from './useCase.js';

function mockDeps(overrides?: DeepPartial<AddBtStrategyDeps>): AddBtStrategyDeps {
  return mergeDeepRight(
    {
      dateService: { getCurrentDate: jest.fn().mockReturnValue(randomAnyDate()) },
      symbolDao: { existByNameAndExchange: jest.fn().mockReturnValue(te.right(true)) },
      btStrategyDao: {
        generateId: jest.fn().mockReturnValue(randomString()),
        add: jest.fn().mockReturnValue(te.right(undefined)),
      },
    },
    overrides ?? {},
  ) as AddBtStrategyDeps;
}
function mockValidRequest(): AddBtStrategyRequest {
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
  it('THEN it should check symbol name once', async () => {
    const deps = mockDeps();
    await executeT(addBtStrategy(deps, mockValidRequest()));

    expect(deps.symbolDao.existByNameAndExchange).toHaveBeenCalledOnce();
  });
  it('THEN it should call generate backtesting strategy ID once', async () => {
    const deps = mockDeps();
    await executeT(addBtStrategy(deps, mockValidRequest()));

    expect(deps.btStrategyDao.generateId).toHaveBeenCalledOnce();
  });
  it('THEN it should call get current date once', async () => {
    const deps = mockDeps();
    await executeT(addBtStrategy(deps, mockValidRequest()));

    expect(deps.dateService.getCurrentDate).toHaveBeenCalledOnce();
  });
  it('THEN it should call add backtesting strategy once', async () => {
    const deps = mockDeps();
    await executeT(addBtStrategy(deps, mockValidRequest()));

    expect(deps.btStrategyDao.add).toHaveBeenCalledOnce();
  });
  it('THEN it should return Right of created ID and timestamp', async () => {
    const id = randomString();
    const currentDate = randomAnyDate();
    const deps = mockDeps({
      dateService: { getCurrentDate: () => currentDate },
      btStrategyDao: { generateId: () => id },
    });
    const result = await executeT(addBtStrategy(deps, mockValidRequest()));

    expect(result).toEqualRight({ id, createdAt: currentDate });
  });
});

describe('WHEN try to add a backtesting strategy with invalid data', () => {
  it('THEN it should return Left of error', async () => {
    const data = { ...mockValidRequest(), startTimestamp: new Date('invalid') };
    const result = await executeT(addBtStrategy(mockDeps(), data));

    expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
  });
});

describe('GIVEN symbol name does not exist WHEN add backtesting strategy', () => {
  it('THEN it should return Left of error', async () => {
    const deps = mockDeps({ symbolDao: { existByNameAndExchange: () => te.right(false) } });
    const result = await executeT(addBtStrategy(deps, mockValidRequest()));

    expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
  });
});

describe('WHEN checking symbol name using DAO fails', () => {
  it('THEN it should return Left of error', async () => {
    const error = createSymbolDaoError('ExistByNameAndExchangeFailed', 'Mock');
    const deps = mockDeps({ symbolDao: { existByNameAndExchange: () => te.left(error) } });
    const result = await executeT(addBtStrategy(deps, mockValidRequest()));

    expect(result).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
  });
});

describe('WHEN adding a backtesting strategy using DAO fails', () => {
  it('THEN it should return Left of error', async () => {
    const error = createBtStrategyDaoError('AddFailed', 'Mock');
    const deps = mockDeps({ btStrategyDao: { add: () => te.left(error) } });
    const result = await executeT(addBtStrategy(deps, mockValidRequest()));

    expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyDaoError));
  });
});
