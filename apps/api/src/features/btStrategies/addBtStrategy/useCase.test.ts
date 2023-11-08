import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { exchangeNameEnum } from '#features/shared/exchange.js';
import { languageEnum } from '#features/shared/strategy.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { createSymbolDaoError, isSymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { isGeneralError } from '#shared/errors/generalError.js';
import { ValidDate } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';
import { TimezoneString } from '#shared/utils/string.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';

import { createBtStrategyDaoError, isBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BtStrategyId } from '../dataModels/btStrategy.js';
import { AddBtStrategyDeps, addBtStrategy } from './useCase.js';

function mockDeps(override?: DeepPartial<AddBtStrategyDeps>): AddBtStrategyDeps {
  return mergeDeepRight(
    {
      dateService: { getCurrentDate: jest.fn().mockReturnValue(new Date('2010-03-04')) },
      symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
      btStrategyDao: {
        generateId: jest.fn().mockReturnValue('random'),
        add: jest.fn().mockReturnValue(te.right(undefined)),
      },
    },
    override ?? {},
  ) as AddBtStrategyDeps;
}

const defaultRequest = {
  name: 'name',
  exchange: exchangeNameEnum.BINANCE,
  symbol: 'BTCUSDT',
  timeframe: timeframeEnum['1h'],
  maxNumKlines: 10,
  initialCapital: 1000,
  assetCurrency: 'BTC',
  capitalCurrency: 'USDT',
  takerFeeRate: 1,
  makerFeeRate: 2,
  startTimestamp: new Date('2010-03-01') as ValidDate,
  endTimestamp: new Date('2010-03-02') as ValidDate,
  timezone: '+03:00' as TimezoneString,
  language: languageEnum.typescript,
  body: 'console.log("Hi")',
};

describe('[GIVEN] the backtesting strategy uses base asset of symbol as currency', () => {
  const currentDate = new Date('2010-03-04') as ValidDate;
  const symbol = mockBnbSymbol();
  const btStrategyId = 'IagebpxnMd' as BtStrategyId;
  const request = {
    ...defaultRequest,
    symbol: symbol.name,
    exchange: symbol.exchange,
    capitalCurrency: symbol.baseAsset,
    assetCurrency: symbol.quoteAsset,
  };

  describe('[WHEN] add the backtesting strategy', () => {
    it('[THEN] it will call DAO to get symbol by name and exchange', async () => {
      const deps = mockDeps({
        dateService: { getCurrentDate: () => currentDate },
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(symbol)) },
        btStrategyDao: {
          generateId: () => btStrategyId,
          add: jest.fn().mockReturnValue(te.right(undefined)),
        },
      });

      await executeT(addBtStrategy(deps, request));

      expect(deps.symbolDao.getByNameAndExchange).toHaveBeenCalledExactlyOnceWith(
        request.symbol,
        request.exchange,
      );
    });
    it('[THEN] it will call DAO to add the backtesting strategy', async () => {
      const deps = mockDeps({
        dateService: { getCurrentDate: () => currentDate },
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(symbol)) },
        btStrategyDao: {
          generateId: () => btStrategyId,
          add: jest.fn().mockReturnValue(te.right(undefined)),
        },
      });

      await executeT(addBtStrategy(deps, request));

      expect(deps.btStrategyDao.add).toHaveBeenCalledOnce();
    });
    it('[THEN] it will return Right of created backtesting strategy ID and current timestamp', async () => {
      const deps = mockDeps({
        dateService: { getCurrentDate: () => currentDate },
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(symbol)) },
        btStrategyDao: {
          generateId: () => btStrategyId,
          add: jest.fn().mockReturnValue(te.right(undefined)),
        },
      });

      const result = await executeT(addBtStrategy(deps, request));

      expect(result).toEqualRight({ id: btStrategyId, createdAt: currentDate });
    });
  });
});

describe('[GIVEN] the backtesting strategy uses quote asset of symbol as currency', () => {
  describe('[WHEN] add the backtesting strategy', () => {
    const currentDate = new Date('2010-03-04') as ValidDate;
    const symbol = mockBnbSymbol();
    const btStrategyId = 'IagebpxnMd' as BtStrategyId;
    const request = {
      ...defaultRequest,
      symbol: symbol.name,
      exchange: symbol.exchange,
      capitalCurrency: symbol.quoteAsset,
      assetCurrency: symbol.baseAsset,
    };

    it('[THEN] it will call DAO to get symbol by name and exchange', async () => {
      const deps = mockDeps({
        dateService: { getCurrentDate: () => currentDate },
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(symbol)) },
        btStrategyDao: {
          generateId: () => btStrategyId,
          add: jest.fn().mockReturnValue(te.right(undefined)),
        },
      });

      await executeT(addBtStrategy(deps, request));

      expect(deps.symbolDao.getByNameAndExchange).toHaveBeenCalledExactlyOnceWith(
        request.symbol,
        request.exchange,
      );
    });
    it('[THEN] it will call DAO to add the backtesting strategy', async () => {
      const deps = mockDeps({
        dateService: { getCurrentDate: () => currentDate },
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(symbol)) },
        btStrategyDao: {
          generateId: () => btStrategyId,
          add: jest.fn().mockReturnValue(te.right(undefined)),
        },
      });

      await executeT(addBtStrategy(deps, request));

      expect(deps.btStrategyDao.add).toHaveBeenCalledOnce();
    });
    it('[THEN] it will return Right of created backtesting strategy ID and current timestamp', async () => {
      const deps = mockDeps({
        dateService: { getCurrentDate: () => currentDate },
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(symbol)) },
        btStrategyDao: {
          generateId: () => btStrategyId,
          add: jest.fn().mockReturnValue(te.right(undefined)),
        },
      });

      const result = await executeT(addBtStrategy(deps, request));

      expect(result).toEqualRight({ id: btStrategyId, createdAt: currentDate });
    });
  });
});

describe('[GIVEN] the symbol does not exist', () => {
  describe('[WHEN] add the backtesting strategy', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createSymbolDaoError('NotExist', 'Mock');
      const deps = mockDeps({ symbolDao: { getByNameAndExchange: () => te.left(error) } });
      const request = defaultRequest;

      const result = await executeT(addBtStrategy(deps, request));

      expect(result).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
    });
  });
});

describe('[GIVEN] DAO fails to get symbol', () => {
  describe('[WHEN] add a backtesting strategy', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createSymbolDaoError('GetByNameAndExchangeFailed', 'Mock');
      const deps = mockDeps({ symbolDao: { getByNameAndExchange: () => te.left(error) } });
      const request = defaultRequest;

      const result = await executeT(addBtStrategy(deps, request));

      expect(result).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
    });
  });
});

describe('[GIVEN] the backtesting strategy does not use neither base asset nor quote asset of symbol', () => {
  describe('[WHEN] add a backtesting strategy', () => {
    it('[THEN] it will return Left of error', async () => {
      const currentDate = new Date('2010-03-04') as ValidDate;
      const btStrategyId = 'IagebpxnMd' as BtStrategyId;
      const symbol = mockBnbSymbol();
      const deps = mockDeps({
        dateService: { getCurrentDate: () => currentDate },
        symbolDao: { getByNameAndExchange: () => te.right(symbol) },
        btStrategyDao: { generateId: () => btStrategyId },
      });
      const request = {
        ...defaultRequest,
        symbol: symbol.name,
        exchange: symbol.exchange,
        capitalCurrency: 'ELSE',
      };

      const result = await executeT(addBtStrategy(deps, request));

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
});

describe('[GIVEN] the request is invalid', () => {
  describe('[WHEN] add a backtesting strategy', () => {
    it('[THEN] it will return Left of error', async () => {
      const currentDate = new Date('2010-03-04') as ValidDate;
      const symbol = mockBnbSymbol();
      const btStrategyId = 'IagebpxnMd' as BtStrategyId;
      const deps = mockDeps({
        dateService: { getCurrentDate: () => currentDate },
        symbolDao: { getByNameAndExchange: () => te.right(symbol) },
        btStrategyDao: { generateId: () => btStrategyId },
      });
      const request = {
        ...defaultRequest,
        symbol: symbol.name,
        exchange: symbol.exchange,
        capitalCurrency: symbol.baseAsset,
        takerFeeRate: 101,
      };

      const result = await executeT(addBtStrategy(deps, request));

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
});

describe('[GIVEN] DAO fails to add the backtesting strategy', () => {
  describe('[WHEN] add a backtesting strategy', () => {
    it('[THEN] it will return Left of error', async () => {
      const currentDate = new Date('2010-03-04') as ValidDate;
      const symbol = mockBnbSymbol();
      const btStrategyId = 'IagebpxnMd' as BtStrategyId;
      const error = createBtStrategyDaoError('AddFailed', 'Mock');
      const deps = mockDeps({
        dateService: { getCurrentDate: () => currentDate },
        symbolDao: { getByNameAndExchange: () => te.right(symbol) },
        btStrategyDao: { generateId: () => btStrategyId, add: () => te.left(error) },
      });
      const request = {
        ...defaultRequest,
        symbol: symbol.name,
        exchange: symbol.exchange,
        capitalCurrency: symbol.baseAsset,
        assetCurrency: symbol.quoteAsset,
      };

      const result = await executeT(addBtStrategy(deps, request));

      expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyDaoError));
    });
  });
});
