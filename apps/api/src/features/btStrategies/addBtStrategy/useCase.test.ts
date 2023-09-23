import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { createSymbolDaoError, isSymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { isGeneralError } from '#shared/errors/generalError.js';
import { executeT } from '#shared/utils/fp.js';
import { randomBeforeAndAfterDateInPast, randomDate } from '#test-utils/faker/date.js';
import { randomPositiveFloat, randomPositiveInt } from '#test-utils/faker/number.js';
import { randomString } from '#test-utils/faker/string.js';
import { randomExchangeName, randomLanguage, randomTimeframe } from '#test-utils/features/shared/domain.js';
import { mockSymbol, randomAssetName, randomSymbolName } from '#test-utils/features/symbols/models.js';

import { createBtStrategyDaoError, isBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { AddBtStrategyDeps, AddBtStrategyRequest, addBtStrategy } from './useCase.js';

function mockDepsAndRequest(overrides?: {
  deps?: DeepPartial<AddBtStrategyDeps>;
  request?: Partial<AddBtStrategyRequest>;
}) {
  const symbolName = randomSymbolName();
  const exchange = randomExchangeName();
  const currency = randomAssetName();
  const symbol = mockSymbol({ name: symbolName, exchange, baseAsset: currency });

  const currentDate = randomDate();
  const { before, after } = randomBeforeAndAfterDateInPast(currentDate);

  return {
    deps: mergeDeepRight(
      {
        dateService: { getCurrentDate: jest.fn().mockReturnValue(currentDate) },
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(symbol)) },
        btStrategyDao: {
          generateId: jest.fn().mockReturnValue(randomString()),
          add: jest.fn().mockReturnValue(te.right(undefined)),
        },
      },
      overrides?.deps ?? {},
    ) as AddBtStrategyDeps,
    request: {
      name: randomString(),
      exchange,
      symbol: symbolName,
      currency: currency,
      timeframe: randomTimeframe(),
      maxNumKlines: randomPositiveInt(),
      initialCapital: randomPositiveFloat(),
      takerFeeRate: randomPositiveFloat(),
      makerFeeRate: randomPositiveFloat(),
      startTimestamp: before,
      endTimestamp: after,
      language: randomLanguage(),
      body: randomString(),
      ...overrides?.request,
    },
  };
}

describe('[WHEN] add a backtesting strategy that uses base asset of symbol as currency', () => {
  function setupScenario() {
    const symbol = mockSymbol();
    return mockDepsAndRequest({
      deps: { symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(symbol)) } },
      request: { symbol: symbol.name, exchange: symbol.exchange, currency: symbol.baseAsset },
    });
  }

  it('[THEN] it will call DAO to get symbol by name and exchange', async () => {
    const { deps, request } = setupScenario();

    await executeT(addBtStrategy(deps, request));

    expect(deps.symbolDao.getByNameAndExchange).toHaveBeenCalledExactlyOnceWith(
      request.symbol,
      request.exchange,
    );
  });
  it('[THEN] it will call DAO to add the backtesting strategy', async () => {
    const { deps, request } = setupScenario();

    await executeT(addBtStrategy(deps, request));

    expect(deps.btStrategyDao.add).toHaveBeenCalledOnce();
  });
  it('[THEN] it will return Right of created backtesting strategy ID and current timestamp', async () => {
    const { deps, request } = setupScenario();

    const result = await executeT(addBtStrategy(deps, request));

    expect(result).toEqualRight({
      id: deps.btStrategyDao.generateId(),
      createdAt: deps.dateService.getCurrentDate(),
    });
  });
});

describe('[WHEN] add a backtesting strategy that uses quote asset of symbol as currency', () => {
  function setupScenario() {
    const symbol = mockSymbol();
    return mockDepsAndRequest({
      deps: { symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(symbol)) } },
      request: { symbol: symbol.name, exchange: symbol.exchange, currency: symbol.quoteAsset },
    });
  }

  it('[THEN] it will call DAO to get symbol by name and exchange', async () => {
    const { deps, request } = setupScenario();

    await executeT(addBtStrategy(deps, request));

    expect(deps.symbolDao.getByNameAndExchange).toHaveBeenCalledExactlyOnceWith(
      request.symbol,
      request.exchange,
    );
  });
  it('[THEN] it will call DAO to add the backtesting strategy', async () => {
    const { deps, request } = setupScenario();

    await executeT(addBtStrategy(deps, request));

    expect(deps.btStrategyDao.add).toHaveBeenCalledOnce();
  });
  it('[THEN] it will return Right of created backtesting strategy ID and current timestamp', async () => {
    const { deps, request } = setupScenario();

    const result = await executeT(addBtStrategy(deps, request));

    expect(result).toEqualRight({
      id: deps.btStrategyDao.generateId(),
      createdAt: deps.dateService.getCurrentDate(),
    });
  });
});

describe('[WHEN] add the backtesting strategy with not existing symbol', () => {
  it('[THEN] it will return Left of error', async () => {
    const error = createSymbolDaoError('NotExist', 'Mock');
    const { deps, request } = mockDepsAndRequest({
      deps: { symbolDao: { getByNameAndExchange: () => te.left(error) } },
    });

    const result = await executeT(addBtStrategy(deps, request));

    expect(result).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
  });
});

describe('[WHEN] add a backtesting strategy with currency that do not match neither base asset nor quote asset of symbol', () => {
  it('[THEN] it will return Left of error', async () => {
    const symbol = mockSymbol();
    const { deps, request } = mockDepsAndRequest({
      deps: { symbolDao: { getByNameAndExchange: () => te.right(symbol) } },
      request: { symbol: symbol.name, exchange: symbol.exchange },
    });

    const result = await executeT(addBtStrategy(deps, request));

    expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
  });
});

describe('[WHEN] add a backtesting strategy [BUT] DAO fails to get symbol', () => {
  it('[THEN] it will return Left of error', async () => {
    const error = createSymbolDaoError('GetByNameAndExchangeFailed', 'Mock');
    const { deps, request } = mockDepsAndRequest({
      deps: { symbolDao: { getByNameAndExchange: () => te.left(error) } },
    });

    const result = await executeT(addBtStrategy(deps, request));

    expect(result).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
  });
});

describe('[WHEN] add a backtesting strategy with invalid data', () => {
  it('[THEN] it will return Left of error', async () => {
    const { deps, request } = mockDepsAndRequest({ request: { maxNumKlines: 0.1 } });

    const result = await executeT(addBtStrategy(deps, request));

    expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
  });
});

describe('[WHEN] add a backtesting strategy [BUT] DAO fails to add the backtesting strategy', () => {
  it('[THEN] it will return Left of error', async () => {
    const error = createBtStrategyDaoError('AddFailed', 'Mock');
    const { deps, request } = mockDepsAndRequest({
      deps: { btStrategyDao: { add: () => te.left(error) } },
    });

    const result = await executeT(addBtStrategy(deps, request));

    expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyDaoError));
  });
});
