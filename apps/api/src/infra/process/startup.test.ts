import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { createSymbolDaoError, isSymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { createBnbServiceError, isBnbServiceError } from '#infra/services/binance/error.js';
import { executeT } from '#shared/utils/fp.js';
import { resetEnvVar, setEnvVar } from '#test-utils/envVar.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { mockSymbol } from '#test-utils/features/symbols/models.js';
import { mockLoggerIo } from '#test-utils/services.js';

import { StartupProcessDeps, startupProcess } from './startup.js';

function mockDeps(overrides?: DeepPartial<StartupProcessDeps>): StartupProcessDeps {
  return mergeDeepRight(
    {
      symbolDao: {
        existByExchange: jest.fn().mockReturnValue(te.right(false)),
        add: jest.fn().mockReturnValue(te.right(undefined)),
      },
      bnbService: { getSpotSymbolsList: jest.fn(te.right(generateArrayOf(mockSymbol))) },
      loggerIo: mockLoggerIo(),
    },
    overrides ?? {},
  ) as StartupProcessDeps;
}

const originalEnv = process.env;

afterEach(resetEnvVar(originalEnv));

describe('[GIVEN] application is running in test environment', () => {
  describe('[WHEN] execute startup process', () => {
    it('[THEN] it will skip getting SPOT symbols', async () => {
      setEnvVar('NODE_ENV', 'test');

      const deps = mockDeps();
      await executeT(startupProcess(deps));

      expect(deps.bnbService.getSpotSymbolsList).not.toHaveBeenCalled();
    });
  });
});

describe('[GIVEN] application is running in environment other than test environment [AND] there is existing symbols in database', () => {
  beforeEach(setEnvVar('NODE_ENV', 'development'));

  describe('[WHEN] execute startup process', () => {
    it('[THEN] it will not try to get SPOT symbols from Binance server', async () => {
      const deps = mockDeps({ symbolDao: { existByExchange: () => te.right(true) } });

      await executeT(startupProcess(deps));

      expect(deps.bnbService.getSpotSymbolsList).not.toHaveBeenCalled();
    });
  });
});

describe('[GIVEN] application is running in environment other than test environment [BUT] there is no binance symbol in database', () => {
  beforeEach(setEnvVar('NODE_ENV', 'development'));

  describe('[WHEN] execute startup process', () => {
    it('[THEN] it will get SPOT symbols from Binance server', async () => {
      const deps = mockDeps();

      await executeT(startupProcess(deps));

      expect(deps.bnbService.getSpotSymbolsList).toHaveBeenCalledOnce();
    });
    it('[THEN] it will add symbols using symbol model DAO', async () => {
      const symbols = generateArrayOf(mockSymbol);
      const deps = mockDeps({ bnbService: { getSpotSymbolsList: te.right(symbols) } });

      await executeT(startupProcess(deps));

      expect(deps.symbolDao.add).toHaveBeenCalledExactlyOnceWith(symbols);
    });
    it('[THEN] it will return Right of undefined', async () => {
      const deps = mockDeps();

      const result = await executeT(startupProcess(deps));

      expect(result).toEqualRight(undefined);
    });
  });
});

describe('[GIVEN] application is running in environment other than test environment [BUT] there is no binance symbol in database [AND] getting SPOT symbols from Binance server fails', () => {
  beforeEach(setEnvVar('NODE_ENV', 'development'));

  describe('[WHEN] execute startup process', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createBnbServiceError('GetSpotSymbolsFailed', 'Mock');
      const deps = mockDeps({ bnbService: { getSpotSymbolsList: te.left(error) } });

      const result = await executeT(startupProcess(deps));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
});

describe('[GIVEN] application is running in environment other than test environment [BUT] there is no binance symbol in database [AND] getting SPOT symbols from Binance server succeeds [BUT] DAO fails to add symbols', () => {
  beforeEach(setEnvVar('NODE_ENV', 'development'));

  describe('[WHEN] execute startup process', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createSymbolDaoError('AddFailed', 'Mock');
      const deps = mockDeps({ symbolDao: { add: () => te.left(error) } });

      const result = await executeT(startupProcess(deps));

      expect(result).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
    });
  });
});
