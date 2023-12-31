import { exchangeNameEnum } from '#features/shared/exchange.js';
import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { createMongoClient } from '#test-utils/mongoDb.js';

import { isSymbolDaoError } from './symbol.error.js';
import {
  addSymbolModels,
  existSymbolModelByExchange,
  getAllSymbolModels,
  getSymbolModelByNameAndExchange,
} from './symbol.feature.js';
import { SymbolMongooseModel, buildSymbolDao, symbolModelName } from './symbol.js';

const client = await createMongoClient();
const symbolDao = unsafeUnwrapEitherRight(executeIo(buildSymbolDao(client)));
const symbolModel: SymbolMongooseModel = client.models[symbolModelName];

afterEach(() => symbolModel.deleteMany());
afterAll(() => client.disconnect());

describe('UUT: Add symbol models', () => {
  const addFn = symbolDao.composeWith(addSymbolModels);

  describe('[GIVEN] the combination of exchange name and symbol name does not exist', () => {
    const symbol = mockBnbSymbol();

    describe('[WHEN] add a symbol', () => {
      it('[THEN] it will insert the symbol into database', async () => {
        await executeT(addFn(symbol));

        const findResult = await symbolModel.find({ name: symbol.name });
        expect(findResult).not.toBeNull();
      });
      it('[THEN] it will return Right of undefined', async () => {
        const result = await executeT(addFn(symbol));

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] all symbols in the input list do not have existing combination of exchange name and symbol name', () => {
    const symbols = [
      mockBnbSymbol({ name: 'BTCUSDT', exchange: exchangeNameEnum.BINANCE }),
      mockBnbSymbol({ name: 'BNBUSDT', exchange: exchangeNameEnum.BINANCE }),
      mockBnbSymbol({ name: 'ETHUSDT', exchange: exchangeNameEnum.BINANCE }),
    ];

    describe('[WHEN] add those symbols', () => {
      it('[THEN] it will insert those symbols into database', async () => {
        await executeT(addFn(symbols));

        const findResult = await symbolModel.find({ name: { $in: ['BTCUSDT', 'BNBUSDT', 'ETHUSDT'] } });
        expect(findResult).toHaveLength(3);
      });
      it('[THEN] it will return Right of undefined', async () => {
        const result = await executeT(addFn(symbols));

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] some symbols in the input list have existing combination of exchange name and symbol name', () => {
    const existingSymbol = mockBnbSymbol({ name: 'BTCUSDT', exchange: exchangeNameEnum.BINANCE });
    const symbols = [
      existingSymbol,
      mockBnbSymbol({ name: 'BNBUSDT', exchange: exchangeNameEnum.BINANCE }),
      mockBnbSymbol({ name: 'ETHUSDT', exchange: exchangeNameEnum.BINANCE }),
    ];

    describe('[WHEN] add those symbols', () => {
      it('[THEN] it will skip those existing klines', async () => {
        await symbolModel.create(existingSymbol);

        await executeT(addFn(symbols));

        const findResult = await symbolModel.find({ name: { $in: ['BTCUSDT', 'BNBUSDT', 'ETHUSDT'] } });
        expect(findResult).toHaveLength(symbols.length);
      });
      it('[THEN] it will still return Right of undefined', async () => {
        await symbolModel.create(existingSymbol);

        const result = await executeT(addFn(symbols));

        expect(result).toEqualRight(undefined);
      });
    });
  });
});

describe('UUT: Get all symbol models', () => {
  const getAllFn = symbolDao.composeWith(getAllSymbolModels);

  describe('[GIVEN] there is no existing symbol', () => {
    describe('[WHEN] get all symbol models', () => {
      it('[THEN] it will return Right of an empty array', async () => {
        const getResult = await executeT(getAllFn);

        expect(getResult).toEqualRight([]);
      });
    });
  });

  describe('[GIVEN] there is existing symbols', () => {
    describe('[WHEN] get all symbol models', () => {
      it('[THEN] it will return Right of an array with the existing symbols', async () => {
        const symbols = [
          mockBnbSymbol({ name: 'BTCUSDT', exchange: exchangeNameEnum.BINANCE }),
          mockBnbSymbol({ name: 'BNBUSDT', exchange: exchangeNameEnum.BINANCE }),
          mockBnbSymbol({ name: 'ETHUSDT', exchange: exchangeNameEnum.BINANCE }),
        ];
        await symbolModel.insertMany(symbols);

        const getResult = await executeT(getAllFn);

        expect(getResult).toEqualRight(expect.toIncludeAllMembers(symbols));
      });
    });
  });
});

describe('UUT: Check existence of symbol models by exchange name', () => {
  const existFn = symbolDao.composeWith(existSymbolModelByExchange);

  describe('[GIVEN] some symbol of the exchange already exists', () => {
    describe('[WHEN] check existence by exchange', () => {
      it('[THEN] it will return Right of true', async () => {
        const symbol = mockBnbSymbol();
        await symbolModel.create(symbol);

        const result = await executeT(existFn(symbol.exchange));

        expect(result).toEqualRight(true);
      });
    });
  });

  describe('[GIVEN] the ID does not exist', () => {
    describe('[WHEN] check existence by exchange', () => {
      it('[THEN] it will return Right of false', async () => {
        const result = await executeT(existFn(exchangeNameEnum.BINANCE));

        expect(result).toEqualRight(false);
      });
    });
  });
});

describe('UUT: Get symbol models by name and exchange name', () => {
  const getFn = symbolDao.composeWith(getSymbolModelByNameAndExchange);

  describe('GIVEN a symbol with this name and exchange exists', () => {
    describe('[WHEN] get a symbol with name and exchange name', () => {
      it('[THEN] it will return Right of the symbol', async () => {
        const symbol = mockBnbSymbol();
        await symbolModel.create(symbol);

        const result = await executeT(getFn(symbol.name, symbol.exchange));

        expect(result).toEqualRight(symbol);
      });
    });
  });

  describe('[GIVEN] there is no symbol with this name and exchange', () => {
    describe('[WHEN] get a symbol with name and exchange name', () => {
      it('[THEN] it will return Left of error', async () => {
        const result = await executeT(getFn('random', exchangeNameEnum.BINANCE));

        expect(result).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
      });
    });
  });
});
