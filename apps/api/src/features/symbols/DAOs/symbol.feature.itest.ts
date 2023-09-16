import { prop } from 'ramda';

import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { randomExchangeName } from '#test-utils/domain.js';
import { generateArrayOf, randomString } from '#test-utils/faker.js';
import { mockSymbol } from '#test-utils/features/symbols/models.js';
import { createMongoClient } from '#test-utils/mongoDb.js';

import { isSymbolDaoError } from './symbol.error.js';
import {
  addSymbolModels,
  existSymbolModelByExchange,
  existSymbolModelByNameAndExchange,
  getAllSymbolModels,
} from './symbol.feature.js';
import { SymbolMongooseModel, buildSymbolDao, symbolModelName } from './symbol.js';

const client = await createMongoClient();
const symbolDao = unsafeUnwrapEitherRight(executeIo(buildSymbolDao(client)));
const symbolModel: SymbolMongooseModel = client.models[symbolModelName];

afterEach(() => symbolModel.deleteMany());
afterAll(() => client.disconnect());

describe('Add symbol models', () => {
  const addFn = symbolDao.composeWith(addSymbolModels);

  describe('WHEN successfully add a symbol', () => {
    it('THEN it should return Right of undefined', async () => {
      const result = await executeT(addFn(mockSymbol()));

      expect(result).toEqualRight(undefined);
    });
    it('THEN it should insert the symbol into database', async () => {
      const symbol = mockSymbol();
      await executeT(addFn(symbol));

      const findResult = await symbolModel.find({ name: symbol.name });
      expect(findResult).not.toBeNull();
    });
  });

  describe('WHEN successfully add multiple symbols at the same time', () => {
    it('THEN it should return Right of undefined', async () => {
      const symbols = generateArrayOf(mockSymbol);
      const result = await executeT(addFn(symbols));

      expect(result).toEqualRight(undefined);
    });
    it('THEN it should insert those symbols into database', async () => {
      const symbols = generateArrayOf(mockSymbol);
      await executeT(addFn(symbols));

      const namesList = symbols.map(prop('name'));
      const findResult = await symbolModel.find({ name: { $in: namesList } });
      expect(findResult).toHaveLength(namesList.length);
    });
  });

  describe('WHEN add a new symbol with existing combination of symbol name and exchange', () => {
    it('THEN it should return Left of error', async () => {
      const symbol1 = mockSymbol();
      await symbolModel.create(symbol1);

      const symbol2 = mockSymbol({ name: symbol1.name, exchange: symbol1.exchange });
      const result = await executeT(addFn(symbol2));

      expect(result).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
    });
    it('THEN it should not record into database', async () => {
      const symbol1 = mockSymbol();
      await symbolModel.create(symbol1);

      const symbol2 = mockSymbol({ name: symbol1.name, exchange: symbol1.exchange });
      await executeT(addFn(symbol2));

      await expect(symbolModel.count({ name: symbol1.name, exchange: symbol1.exchange })).resolves.toBe(1);
    });
  });
});

describe('Get all symbol models', () => {
  const getAllFn = symbolDao.composeWith(getAllSymbolModels);

  describe('GIVEN there is no existing symbol WHEN get all symbol models', () => {
    it('THEN it should return Right of an empty array', async () => {
      const getResult = await executeT(getAllFn);

      expect(getResult).toEqualRight([]);
    });
  });

  describe('GIVEN there is existing symbols WHEN get all symbol models', () => {
    it('THEN it should return Right of an array with the existing symbols', async () => {
      const symbols = generateArrayOf(mockSymbol);
      await symbolModel.insertMany(symbols);

      const getResult = await executeT(getAllFn);

      expect(getResult).toEqualRight(expect.toIncludeAllMembers(symbols));
    });
  });
});

describe('Check existence of symbol models by exchange name', () => {
  const existFn = symbolDao.composeWith(existSymbolModelByExchange);

  describe('GIVEN some symbol of the exchange already exists WHEN check existence by exchange', () => {
    it('THEN it should return Right of true', async () => {
      const symbol = mockSymbol();
      await symbolModel.create(symbol);

      const result = await executeT(existFn(symbol.exchange));

      expect(result).toEqualRight(true);
    });
  });

  describe('GIVEN the ID does not exist WHEN check existence by ID', () => {
    it('THEN it should return Right of false', async () => {
      const result = await executeT(existFn(randomExchangeName()));

      expect(result).toEqualRight(false);
    });
  });
});

describe('Check existence of symbol models by symbol name and exchange name', () => {
  const existFn = symbolDao.composeWith(existSymbolModelByNameAndExchange);

  describe('GIVEN a symbol with the symbol name and exchange name exists WHEN check existence', () => {
    it('THEN it should return Right of true', async () => {
      const symbol = mockSymbol();
      await symbolModel.create(symbol);

      const result = await executeT(existFn(symbol.name, symbol.exchange));

      expect(result).toEqualRight(true);
    });
  });

  describe('GIVEN the combination of symbol name and exchange name does not exist WHEN check existence', () => {
    it('THEN it should return Right of false', async () => {
      const result = await executeT(existFn(randomString(), randomExchangeName()));

      expect(result).toEqualRight(false);
    });
  });
});
