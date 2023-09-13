import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';

import {
  createSymbolModelDaoError,
  isSymbolModelDaoError,
} from '#features/symbols/data-models/symbol.dao.error.js';
import { createBnbServiceError, isBnbServiceError } from '#infra/services/binance/error.js';
import { DeepPartial } from '#shared/common.type.js';
import { executeT } from '#shared/utils/fp.js';
import { resetEnvVar, setEnvVar } from '#test-utils/envVar.js';
import { generateArrayOf } from '#test-utils/faker.js';
import { mockSymbol } from '#test-utils/features/symbols/models.js';
import { mockLoggerIo } from '#test-utils/services.js';

import { StartupProcessDeps, startupProcess } from './startup.js';

function mockDeps(overrides?: DeepPartial<StartupProcessDeps>): StartupProcessDeps {
  return mergeDeepRight(
    {
      symbolModelDao: {
        existByExchange: jest.fn().mockReturnValue(te.right(false)),
        add: jest.fn().mockReturnValue(te.right(undefined)),
      },
      bnbService: { getSpotSymbols: jest.fn(te.right(generateArrayOf(mockSymbol))) },
      logger: mockLoggerIo(),
    },
    overrides ?? {},
  ) as StartupProcessDeps;
}

const originalEnv = process.env;

afterEach(resetEnvVar(originalEnv));

describe('GIVEN application is running in test environment WHEN execute startup process', () => {
  it('THEN it should skip getting SPOT symbols', async () => {
    setEnvVar('NODE_ENV', 'test');

    const deps = mockDeps();
    await executeT(startupProcess(deps));

    expect(deps.bnbService.getSpotSymbols).not.toHaveBeenCalled();
  });
});

describe('GIVEN application is running in environment other than test environment', () => {
  beforeEach(setEnvVar('NODE_ENV', 'development'));

  describe('GIVEN there is existing symbols in database WHEN execute startup process', () => {
    it('THEN it should not try to get SPOT symbols from Binance server', async () => {
      const deps = mockDeps({ symbolModelDao: { existByExchange: () => te.right(true) } });
      await executeT(startupProcess(deps));

      expect(deps.bnbService.getSpotSymbols).not.toHaveBeenCalled();
    });
  });

  describe('GIVEN there is no binance symbol in database WHEN execute startup process', () => {
    it('THEN it should get SPOT symbols from Binance server', async () => {
      const deps = mockDeps();
      await executeT(startupProcess(deps));

      expect(deps.bnbService.getSpotSymbols).toHaveBeenCalledOnce();
    });

    describe('WHEN getting SPOT symbols from Binance server fails', () => {
      it('THEN it should return Left of error', async () => {
        const error = createBnbServiceError('GetSpotSymbolsFailed', 'Mock');
        const deps = mockDeps({ bnbService: { getSpotSymbols: te.left(error) } });
        const result = await executeT(startupProcess(deps));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });

    describe('WHEN getting SPOT symbols from Binance server is successful', () => {
      it('THEN it should add symbols using symbol model DAO', async () => {
        const symbols = generateArrayOf(mockSymbol);
        const deps = mockDeps({ bnbService: { getSpotSymbols: te.right(symbols) } });
        await executeT(startupProcess(deps));

        expect(deps.symbolModelDao.add).toHaveBeenCalledExactlyOnceWith(symbols);
      });
    });

    describe('WHEN adding symbols into database fails', () => {
      it('THEN it should return Left of error', async () => {
        const error = createSymbolModelDaoError('AddFailed', 'Mock');
        const deps = mockDeps({ symbolModelDao: { add: () => te.left(error) } });
        const result = await executeT(startupProcess(deps));

        expect(result).toEqualLeft(expect.toSatisfy(isSymbolModelDaoError));
      });
    });

    describe('WHEN adding symbols into database is successful', () => {
      it('THEN it should return Right of undefined', async () => {
        const deps = mockDeps();
        const result = await executeT(startupProcess(deps));

        expect(result).toEqualRight(undefined);
      });
    });
  });
});
