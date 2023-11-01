import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { createKlineDaoError, isKlineDaoError } from '#features/btStrategies/DAOs/kline.error.js';
import { DateRange } from '#features/shared/objectValues/dateRange.js';
import { createSymbolDaoError, isSymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { createBnbServiceError, isBnbServiceError } from '#infra/services/binance/error.js';
import { executeT } from '#shared/utils/fp.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { mockKline } from '#test-utils/features/shared/kline.js';

import {
  GetKlinesByParamsUseCaseDeps,
  GetKlinesByParamsUseCaseReq,
  getKlinesByParamsUseCase,
} from './useCase.js';

function mockDeps(override?: DeepPartial<GetKlinesByParamsUseCaseDeps>): GetKlinesByParamsUseCaseDeps {
  return mergeDeepRight<GetKlinesByParamsUseCaseDeps, DeepPartial<GetKlinesByParamsUseCaseDeps>>(
    {
      symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
      klineDao: {
        count: jest.fn().mockReturnValue(te.right(10)),
        get: jest.fn().mockReturnValue(te.right(generateArrayOf(mockKline))),
        add: jest.fn().mockReturnValue(te.right(undefined)),
      },
      bnbService: { downloadKlines: jest.fn().mockReturnValue(te.right(generateArrayOf(mockKline))) },
    },
    override ?? {},
  );
}

const baseRequest: GetKlinesByParamsUseCaseReq = {
  exchange: 'BINANCE',
  symbol: 'BTCUSDT',
  timeframe: '1d',
  dateRange: { start: new Date('2022-10-04'), end: new Date('2022-10-05') } as DateRange,
};

describe('[GIVEN] the symbol does not exist', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createSymbolDaoError('NotExist', 'Mock');
      const deps = mockDeps({
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.left(error)) },
      });
      const request = baseRequest;

      const result = await executeT(getKlinesByParamsUseCase(deps, request));

      expect(result).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
    });
  });
});

describe('[GIVEN] symbol DAO fails to get symbol by name and exchange', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createSymbolDaoError('GetByNameAndExchangeFailed', 'Mock');
      const deps = mockDeps({
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.left(error)) },
      });
      const request = baseRequest;

      const result = await executeT(getKlinesByParamsUseCase(deps, request));

      expect(result).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
    });
  });
});

describe('[GIVEN] the symbol exists', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will count existing klines in the given range', async () => {
      const deps = mockDeps({
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
        klineDao: { count: jest.fn().mockReturnValue(te.right(10)) },
      });
      const request = baseRequest;

      await executeT(getKlinesByParamsUseCase(deps, request));

      expect(deps.klineDao.count).toHaveBeenCalledExactlyOnceWith({
        exchange: baseRequest.exchange,
        symbol: baseRequest.symbol,
        timeframe: baseRequest.timeframe,
        start: baseRequest.dateRange.start,
        end: baseRequest.dateRange.end,
      });
    });
  });
});

describe('[GIVEN] the symbol exists [BUT] counting klines failed', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createKlineDaoError('CountFailed', 'Mock');
      const deps = mockDeps({
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
        klineDao: { count: jest.fn().mockReturnValue(te.left(error)) },
      });
      const request = baseRequest;

      const result = await executeT(getKlinesByParamsUseCase(deps, request));

      expect(result).toEqualLeft(expect.toSatisfy(isKlineDaoError));
    });
  });
});

describe('[GIVEN] existing klines in given range is greater than or equal to expected', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will get klines in given range', async () => {
      const deps = mockDeps({
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
        klineDao: {
          count: jest.fn().mockReturnValue(te.right(24)),
          get: jest.fn().mockReturnValue(te.right(generateArrayOf(mockKline))),
        },
      });
      const request: GetKlinesByParamsUseCaseReq = {
        ...baseRequest,
        timeframe: '1h',
        dateRange: { start: new Date('2023-03-04'), end: new Date('2023-03-05') } as DateRange,
      };

      await executeT(getKlinesByParamsUseCase(deps, request));

      expect(deps.klineDao.get).toHaveBeenCalledExactlyOnceWith({
        exchange: request.exchange,
        symbol: request.symbol,
        timeframe: request.timeframe,
        start: request.dateRange.start,
        end: request.dateRange.end,
      });
    });
  });
});

describe('[GIVEN] getting klines in given range fails', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createKlineDaoError('GetFailed', 'Mock');
      const deps = mockDeps({
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
        klineDao: {
          count: jest.fn().mockReturnValue(te.right(24)),
          get: jest.fn().mockReturnValue(te.left(error)),
        },
      });
      const request: GetKlinesByParamsUseCaseReq = {
        ...baseRequest,
        timeframe: '1h',
        dateRange: { start: new Date('2023-03-04'), end: new Date('2023-03-05') } as DateRange,
      };

      const result = await executeT(getKlinesByParamsUseCase(deps, request));

      expect(result).toEqualLeft(expect.toSatisfy(isKlineDaoError));
    });
  });
});

describe('[GIVEN] getting klines in given range succeeds', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will return Right of a list of klines in given range', async () => {
      const klines = generateArrayOf(mockKline);
      const deps = mockDeps({
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
        klineDao: {
          count: jest.fn().mockReturnValue(te.right(24)),
          get: jest.fn().mockReturnValue(te.right(klines)),
        },
      });
      const request: GetKlinesByParamsUseCaseReq = {
        ...baseRequest,
        timeframe: '1h',
        dateRange: { start: new Date('2023-03-04'), end: new Date('2023-03-05') } as DateRange,
      };

      const result = await executeT(getKlinesByParamsUseCase(deps, request));

      expect(result).toEqualRight(klines);
    });
  });
});

describe('[GIVEN] existing klines in given range is less than expected', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will download klines from server', async () => {
      const deps = mockDeps({
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
        klineDao: { count: jest.fn().mockReturnValue(te.right(1)) },
        bnbService: { downloadKlines: jest.fn().mockReturnValue(te.right(generateArrayOf(mockKline))) },
      });
      const request: GetKlinesByParamsUseCaseReq = {
        ...baseRequest,
        timeframe: '1d',
        dateRange: { start: new Date('2023-03-04'), end: new Date('2023-03-06') } as DateRange,
      };

      await executeT(getKlinesByParamsUseCase(deps, request));

      expect(deps.bnbService.downloadKlines).toHaveBeenCalledExactlyOnceWith({
        executionId: expect.toBeString(),
        symbol: request.symbol,
        timeframe: request.timeframe,
        maxKlinesNum: 0,
        startTimestamp: request.dateRange.start,
        endTimestamp: request.dateRange.end,
      });
    });
  });
});

describe('[GIVEN] downloading klines from server fails', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createBnbServiceError('GetKlinesForBtFailed', 'Mock');
      const deps = mockDeps({
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
        klineDao: { count: jest.fn().mockReturnValue(te.right(1)) },
        bnbService: { downloadKlines: jest.fn().mockReturnValue(te.left(error)) },
      });
      const request: GetKlinesByParamsUseCaseReq = {
        ...baseRequest,
        timeframe: '1d',
        dateRange: { start: new Date('2023-03-04'), end: new Date('2023-03-06') } as DateRange,
      };

      const result = await executeT(getKlinesByParamsUseCase(deps, request));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
});

describe('[GIVEN] downloading klines from server succeeds', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will add returned klines from server to database', async () => {
      const klinesFromServer = generateArrayOf(mockBnbSymbol, 5);
      const deps = mockDeps({
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
        klineDao: {
          count: jest.fn().mockReturnValue(te.right(1)),
          add: jest.fn().mockReturnValue(te.right(undefined)),
        },
        bnbService: { downloadKlines: jest.fn().mockReturnValue(te.right(klinesFromServer)) },
      });
      const request: GetKlinesByParamsUseCaseReq = {
        ...baseRequest,
        timeframe: '1d',
        dateRange: { start: new Date('2023-03-04'), end: new Date('2023-03-06') } as DateRange,
      };

      await executeT(getKlinesByParamsUseCase(deps, request));

      expect(deps.klineDao.add).toHaveBeenCalledExactlyOnceWith(klinesFromServer);
    });
  });
});

describe('[GIVEN] adding returned klines from server to database fails', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will return Right of a list of the returned klines', async () => {
      const klinesFromServer = generateArrayOf(() =>
        mockKline({ closeTimestamp: new Date('2023-03-04 12:00') }),
      );
      const error = createKlineDaoError('AddFailed', 'Mock');
      const deps = mockDeps({
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
        klineDao: {
          count: jest.fn().mockReturnValue(te.right(1)),
          add: jest.fn().mockReturnValue(te.left(error)),
        },
        bnbService: { downloadKlines: jest.fn().mockReturnValue(te.right(klinesFromServer)) },
      });
      const request: GetKlinesByParamsUseCaseReq = {
        ...baseRequest,
        timeframe: '1d',
        dateRange: { start: new Date('2023-03-04'), end: new Date('2023-03-06') } as DateRange,
      };

      const result = await executeT(getKlinesByParamsUseCase(deps, request));

      expect(result).toEqualRight(klinesFromServer);
    });
  });
});

describe('[GIVEN] adding returned klines from server to database succeeds', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will return Right of a list of the returned klines', async () => {
      const klinesFromServer = generateArrayOf(() =>
        mockKline({ closeTimestamp: new Date('2023-03-04 12:00') }),
      );
      const deps = mockDeps({
        symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
        klineDao: {
          count: jest.fn().mockReturnValue(te.right(1)),
          add: jest.fn().mockReturnValue(te.right(undefined)),
        },
        bnbService: { downloadKlines: jest.fn().mockReturnValue(te.right(klinesFromServer)) },
      });
      const request: GetKlinesByParamsUseCaseReq = {
        ...baseRequest,
        timeframe: '1d',
        dateRange: { start: new Date('2023-03-04'), end: new Date('2023-03-06') } as DateRange,
      };

      const result = await executeT(getKlinesByParamsUseCase(deps, request));

      expect(result).toEqualRight(klinesFromServer);
    });
  });
});
