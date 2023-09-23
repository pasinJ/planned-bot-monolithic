import { faker } from '@faker-js/faker';
import { prop } from 'ramda';

import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { randomString } from '#test-utils/faker/string.js';
import { randomExchangeName } from '#test-utils/features/shared/domain.js';
import { mockSymbol } from '#test-utils/features/symbols/models.js';
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

  describe('[WHEN] add a symbol model with not existing combination of exchange and name', () => {
    it('[THEN] it will insert the symbol into database', async () => {
      const symbol = mockSymbol();

      await executeT(addFn(symbol));

      const findResult = await symbolModel.find({ name: symbol.name });
      expect(findResult).not.toBeNull();
    });
    it('[THEN] it will return Right of undefined', async () => {
      const result = await executeT(addFn(mockSymbol()));

      expect(result).toEqualRight(undefined);
    });
  });

  describe('[WHEN] add multiple klines with not existing combination of exchange, symbol, timeframe, and close timestamp', () => {
    it('[THEN] it will insert those klines into database', async () => {
      const symbols = generateArrayOf(mockSymbol);

      await executeT(addFn(symbols));

      const findResult = await symbolModel.find({ name: { $in: symbols.map(prop('name')) } });
      expect(findResult).toHaveLength(symbols.length);
    });
    it('[THEN] it will return Right of undefined', async () => {
      const symbols = generateArrayOf(mockSymbol);

      const result = await executeT(addFn(symbols));

      expect(result).toEqualRight(undefined);
    });
  });

  describe('[WHEN] add multiple symbols with some symbols have existing combination of symbol name and exchange', () => {
    it('[THEN] it will skip those existing klines', async () => {
      const symbols = generateArrayOf(mockSymbol, 5);
      const existingSymbols = faker.helpers.arrayElements(symbols);
      await symbolModel.insertMany(existingSymbols);

      await executeT(addFn(symbols));

      const findResult = await symbolModel.find({ name: { $in: symbols.map(prop('name')) } });
      expect(findResult).toHaveLength(symbols.length);
    });
    it('[THEN] it will still return Right of undefined', async () => {
      const symbols = generateArrayOf(mockSymbol, 5);
      const existingSymbols = faker.helpers.arrayElements(symbols);
      await symbolModel.insertMany(existingSymbols);

      const result = await executeT(addFn(symbols));

      expect(result).toEqualRight(undefined);
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
        const symbols = generateArrayOf(mockSymbol);
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
        const symbol = mockSymbol();
        await symbolModel.create(symbol);

        const result = await executeT(existFn(symbol.exchange));

        expect(result).toEqualRight(true);
      });
    });
  });

  describe('[GIVEN] the ID does not exist', () => {
    describe('[WHEN] check existence by exchange', () => {
      it('[THEN] it will return Right of false', async () => {
        const result = await executeT(existFn(randomExchangeName()));

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
        const symbol = mockSymbol();
        await symbolModel.create(symbol);

        const result = await executeT(getFn(symbol.name, symbol.exchange));

        expect(result).toEqualRight(symbol);
      });
    });
  });

  describe('[GIVEN] there is no symbol with this name and exchange', () => {
    describe('[WHEN] get a symbol with name and exchange name', () => {
      it('[THEN] it will return Left of error', async () => {
        const result = await executeT(getFn(randomString(), randomExchangeName()));

        expect(result).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
      });
    });
  });
});
