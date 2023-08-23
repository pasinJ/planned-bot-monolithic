import { faker } from '@faker-js/faker';
import te from 'fp-ts/lib/TaskEither.js';
import { constVoid } from 'fp-ts/lib/function.js';
import { is } from 'ramda';

import { GetBnbSpotSymbolsError } from '#infra/services/binance.type.js';
import { executeT } from '#shared/utils/fp.js';
import { mockSymbol } from '#test-utils/mockEntity.js';
import { resetEnvVar, setEnvVar } from '#test-utils/mockEnvVar.js';
import { mockSymbolRepository } from '#test-utils/mockRepository.js';
import { mockBnbService, mockLoggerIo } from '#test-utils/mockService.js';

import { startupProcess } from './startup.js';

function setupSuccessCase() {
  const symbols = faker.helpers.multiple(() => mockSymbol({ version: 0 }), { count: 2 });
  const bnbService = mockBnbService({ getSpotSymbols: jest.fn(te.right(symbols)) });
  const symbolRepository = mockSymbolRepository({
    countAll: te.right(0),
    add: jest.fn().mockReturnValue(te.rightIO(constVoid)),
  });
  const deps = { bnbService, symbolRepository, logger: mockLoggerIo() };

  return { deps, symbols };
}
function setupGetSymbolsFailed() {
  const { deps } = setupSuccessCase();
  return {
    ...deps,
    bnbService: mockBnbService({
      getSpotSymbols: te.left(new GetBnbSpotSymbolsError('GET_BNB_SPOT_SYMBOLS_ERROR', 'Mock error')),
    }),
  };
}
function setupAddSymbolsFailed() {
  const { deps } = setupSuccessCase();
  return {
    ...deps,
    symbolRepository: mockSymbolRepository({
      countAll: te.right(0),
      add: jest.fn().mockReturnValue(te.left(new Error('Mock error'))),
    }),
  };
}
function setupExistingSymbols() {
  const { deps } = setupSuccessCase();
  return {
    ...deps,
    symbolRepository: mockSymbolRepository({ countAll: te.right(1) }),
  };
}

const originalEnv = process.env;

afterAll(resetEnvVar(originalEnv));

describe('GIVEN running application in test environment WHEN execute startup process', () => {
  it('THEN it should skip getting SPOT symbols', async () => {
    setEnvVar('NODE_ENV', 'test');

    const { deps } = setupSuccessCase();
    await executeT(startupProcess(deps));

    expect(deps.bnbService.getSpotSymbols).not.toHaveBeenCalled();
  });
});

describe('GIVEN running application in other than test environment', () => {
  beforeAll(setEnvVar('NODE_ENV', 'development'));

  describe('GIVEN there is no symbol in database WHEN execute startup process', () => {
    it('THEN it should get SPOT symbols from Binance server', async () => {
      const { deps } = setupSuccessCase();
      await executeT(startupProcess(deps));

      expect(deps.bnbService.getSpotSymbols).toHaveBeenCalledOnce();
    });
    describe('WHEN getting SPOT symbols from Binance server is successful', () => {
      it('THEN it should add symbols using symbol repository', async () => {
        const { deps, symbols } = setupSuccessCase();
        await executeT(startupProcess(deps));

        expect(deps.symbolRepository.add).toHaveBeenCalledExactlyOnceWith(symbols);
      });
    });
    describe('WHEN adding symbols into database is successful', () => {
      it('THEN it should return Right', async () => {
        const { deps } = setupSuccessCase();
        const result = await executeT(startupProcess(deps));

        expect(result).toBeRight();
      });
    });

    describe('WHEN getting SPOT symbols from Binance server fails', () => {
      it('THEN it should return Left of GET_BNB_SPOT_SYMBOLS_ERROR', async () => {
        const deps = setupGetSymbolsFailed();
        const result = await executeT(startupProcess(deps));

        expect(result).toEqualLeft(expect.toSatisfy(is(Error)));
      });
    });

    describe('WHEN adding symbols into database fails', () => {
      it('THEN it should return Left of error', async () => {
        const deps = setupAddSymbolsFailed();
        const result = await executeT(startupProcess(deps));

        expect(result).toEqualLeft(expect.toSatisfy(is(Error)));
      });
    });
  });

  describe('GIVEN there is existing symbols in database WHEN execute startup process', () => {
    it('THEN it should not try to get SPOT symbols from Binance server', async () => {
      const deps = setupExistingSymbols();
      await executeT(startupProcess(deps));

      expect(deps.bnbService.getSpotSymbols).not.toHaveBeenCalled();
    });
  });
});
