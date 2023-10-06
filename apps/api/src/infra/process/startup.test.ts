import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { createSymbolDaoError, isSymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { createBnbServiceError, isBnbServiceError } from '#infra/services/binance/error.js';
import { Env } from '#shared/app.config.js';
import { executeT } from '#shared/utils/fp.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { mockLoggerIo } from '#test-utils/services.js';

import { StartupProcessDeps, startupProcess } from './startup.js';

function mockDeps(overrides?: DeepPartial<StartupProcessDeps>): StartupProcessDeps {
  return mergeDeepRight<StartupProcessDeps, DeepPartial<StartupProcessDeps>>(
    {
      symbolDao: {
        existByExchange: jest.fn().mockReturnValue(te.right(false)),
        add: jest.fn().mockReturnValue(te.right(undefined)),
      },
      bnbService: { getSpotSymbolsList: jest.fn(te.right(generateArrayOf(mockBnbSymbol))) },
      loggerIo: mockLoggerIo(),
      getAppConfig: () => ({ ENV: 'development' as Env }),
    },
    overrides ?? {},
  ) as StartupProcessDeps;
}

describe('[GIVEN] application is running in test environment', () => {
  describe('[WHEN] execute startup process', () => {
    it('[THEN] it will skip getting SPOT symbols', async () => {
      const ENV = 'test' as Env;
      const deps = mockDeps({ getAppConfig: () => ({ ENV }) });

      await executeT(startupProcess(deps));

      expect(deps.bnbService.getSpotSymbolsList).not.toHaveBeenCalled();
    });
  });
});

describe('[GIVEN] application is running in environment other than test environment [AND] there is existing symbols in database', () => {
  describe('[WHEN] execute startup process', () => {
    it('[THEN] it will not try to get SPOT symbols from Binance server', async () => {
      const ENV = 'production' as Env;
      const deps = mockDeps({
        symbolDao: { existByExchange: () => te.right(true) },
        getAppConfig: () => ({ ENV }),
      });

      await executeT(startupProcess(deps));

      expect(deps.bnbService.getSpotSymbolsList).not.toHaveBeenCalled();
    });
  });
});

describe('[GIVEN] application is running in environment other than test environment [BUT] there is no binance symbol in database', () => {
  const ENV = 'development' as Env;
  let deps: StartupProcessDeps;
  const symbols = generateArrayOf(mockBnbSymbol);

  beforeEach(() => {
    deps = mockDeps({
      getAppConfig: () => ({ ENV }),
      bnbService: { getSpotSymbolsList: jest.fn(te.right(symbols)) },
    });
  });

  describe('[WHEN] execute startup process', () => {
    it('[THEN] it will get SPOT symbols from Binance server', async () => {
      await executeT(startupProcess(deps));

      expect(deps.bnbService.getSpotSymbolsList).toHaveBeenCalledOnce();
    });
    it('[THEN] it will add symbols using symbol model DAO', async () => {
      await executeT(startupProcess(deps));

      expect(deps.symbolDao.add).toHaveBeenCalledExactlyOnceWith(symbols);
    });
    it('[THEN] it will return Right of undefined', async () => {
      const result = await executeT(startupProcess(deps));

      expect(result).toEqualRight(undefined);
    });
  });
});

describe('[GIVEN] application is running in environment other than test environment [BUT] there is no binance symbol in database [AND] getting SPOT symbols from Binance server fails', () => {
  describe('[WHEN] execute startup process', () => {
    it('[THEN] it will return Left of error', async () => {
      const ENV = 'development' as Env;
      const error = createBnbServiceError('GetSpotSymbolsFailed', 'Mock');
      const deps = mockDeps({
        getAppConfig: () => ({ ENV }),
        bnbService: { getSpotSymbolsList: te.left(error) },
      });

      const result = await executeT(startupProcess(deps));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
});

describe('[GIVEN] application is running in environment other than test environment [BUT] there is no binance symbol in database [AND] getting SPOT symbols from Binance server succeeds [BUT] DAO fails to add symbols', () => {
  describe('[WHEN] execute startup process', () => {
    it('[THEN] it will return Left of error', async () => {
      const ENV = 'development' as Env;
      const error = createSymbolDaoError('AddFailed', 'Mock');
      const deps = mockDeps({ getAppConfig: () => ({ ENV }), symbolDao: { add: () => te.left(error) } });

      const result = await executeT(startupProcess(deps));

      expect(result).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
    });
  });
});
