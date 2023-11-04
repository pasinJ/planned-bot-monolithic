import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { ValidDate } from '#SECT/date.js';
import { exchangeNameEnum } from '#features/shared/exchange.js';
import { languageEnum } from '#features/shared/strategy.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { createSymbolDaoError, isSymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { isGeneralError } from '#shared/errors/generalError.js';
import { executeT } from '#shared/utils/fp.js';
import { TimezoneString } from '#shared/utils/string.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';

import { createBtStrategyDaoError, isBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import updateBtStrategyUseCase, {
  UpdateBtStrategyUseCaseDeps,
  UpdateBtStrategyUseCaseReq,
} from './useCase.js';

function mockDeps(override?: DeepPartial<UpdateBtStrategyUseCaseDeps>): UpdateBtStrategyUseCaseDeps {
  return mergeDeepRight<UpdateBtStrategyUseCaseDeps, DeepPartial<UpdateBtStrategyUseCaseDeps>>(
    {
      dateService: { getCurrentDate: jest.fn().mockReturnValue(new Date('2010-03-04')) },
      symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
      btStrategyDao: { updateById: jest.fn().mockReturnValue(te.right(undefined)) },
    },
    override ?? {},
  );
}

const baseReq: UpdateBtStrategyUseCaseReq = {
  id: 'RoyZ985xvp',
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
  btRange: {
    start: new Date('2010-03-01') as ValidDate,
    end: new Date('2010-03-02') as ValidDate,
  },
  timezone: '+03:00' as TimezoneString,
  language: languageEnum.typescript,
  body: 'console.log("Hi")',
};

describe('[GIVEN] symbol does not exist', () => {
  describe('[WHEN] update backtesting strategy', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createSymbolDaoError('NotExist', 'Mock');
      const deps = mockDeps({ symbolDao: { getByNameAndExchange: () => te.left(error) } });
      const req = baseReq;

      const result = await executeT(updateBtStrategyUseCase(deps, req));

      expect(result).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
    });
  });
});

describe("[GIVEN] asset or capital currencies does not match symbol's currencies", () => {
  describe('[WHEN] update backtesting strategy', () => {
    it('[THEN] it will return Left of error', async () => {
      const symbol = mockBnbSymbol({ baseAsset: 'BTC', quoteAsset: 'USDT' });
      const deps = mockDeps({ symbolDao: { getByNameAndExchange: () => te.right(symbol) } });
      const req: UpdateBtStrategyUseCaseReq = { ...baseReq, assetCurrency: 'BTC', capitalCurrency: 'BNB' };

      const result = await executeT(updateBtStrategyUseCase(deps, req));

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
});

describe('[GIVEN] some property is invalid and cause backtesting strategy creation to fail', () => {
  describe('[WHEN] update backtesting strategy', () => {
    it('[THEN] it will return Left of error', async () => {
      const symbol = mockBnbSymbol({ baseAsset: 'BTC', quoteAsset: 'USDT' });
      const deps = mockDeps({ symbolDao: { getByNameAndExchange: () => te.right(symbol) } });
      const req: UpdateBtStrategyUseCaseReq = {
        ...baseReq,
        assetCurrency: 'BTC',
        capitalCurrency: 'USDT',
        initialCapital: -1,
      };

      const result = await executeT(updateBtStrategyUseCase(deps, req));

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
});

describe('[GIVEN] backtesting strategy of given ID does not exist', () => {
  describe('[WHEN] update backtesting strategy', () => {
    it('[THEN] it will return Left of error', async () => {
      const symbol = mockBnbSymbol({ baseAsset: 'BTC', quoteAsset: 'USDT' });
      const error = createBtStrategyDaoError('NotExist', 'Mock');
      const deps = mockDeps({
        symbolDao: { getByNameAndExchange: () => te.right(symbol) },
        btStrategyDao: { updateById: () => te.left(error) },
      });
      const req: UpdateBtStrategyUseCaseReq = { ...baseReq, assetCurrency: 'BTC', capitalCurrency: 'USDT' };

      const result = await executeT(updateBtStrategyUseCase(deps, req));

      expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyDaoError));
    });
  });
});

describe('[GIVEN] updating backtesting strategy succeeds', () => {
  describe('[WHEN] update backtesting strategy', () => {
    it('[THEN] it will return Right of updating timestamp', async () => {
      const currentDate = new Date('2022-04-06') as ValidDate;
      const symbol = mockBnbSymbol({ baseAsset: 'BTC', quoteAsset: 'USDT' });
      const deps = mockDeps({
        dateService: { getCurrentDate: () => currentDate },
        symbolDao: { getByNameAndExchange: () => te.right(symbol) },
        btStrategyDao: { updateById: () => te.right(undefined) },
      });
      const req: UpdateBtStrategyUseCaseReq = { ...baseReq, assetCurrency: 'BTC', capitalCurrency: 'USDT' };

      const result = await executeT(updateBtStrategyUseCase(deps, req));

      expect(result).toEqualRight({ updatedAt: currentDate });
    });
  });
});
