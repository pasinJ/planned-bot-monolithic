import { Schema } from 'mongoose';
import { prop } from 'ramda';

import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { randomExchangeName } from '#test-utils/domain.js';
import { generateArrayOf } from '#test-utils/faker.js';
import { mockSymbol } from '#test-utils/features/symbols/models.js';
import { createMongoClient, deleteModel } from '#test-utils/mongoDb.js';

import { isSymbolModelDaoError } from './symbol.dao.error.js';
import { SymbolMongooseModel, createSymbolModelDao, symbolModelName } from './symbol.dao.js';
import { SymbolModelDao } from './symbol.dao.type.js';

const client = await createMongoClient();

afterAll(() => client.disconnect());

describe('Create symbol model DAO', () => {
  afterEach(() => deleteModel(client, symbolModelName));

  describe('WHEN successfully create symbol model DAO', () => {
    it('THEN it should return Right of symbol model DAO', () => {
      const repository = executeIo(createSymbolModelDao(client));
      expect(repository).toEqualRight(
        expect.toContainAllKeys(['generateId', 'add', 'getAll', 'existByExchange']),
      );
    });
  });
  describe('WHEN unsuccessfully create symbol model DAO (duplicated model)', () => {
    it('THEN it should return Left of symbol model DAO error', () => {
      client.model(symbolModelName, new Schema({}));
      const repository = executeIo(createSymbolModelDao(client));
      expect(repository).toEqualLeft(expect.toSatisfy(isSymbolModelDaoError));
    });
  });
});

describe('Symbol model Dao', () => {
  let symbolModelDao: SymbolModelDao;
  let symbolModel: SymbolMongooseModel;

  beforeAll(() => {
    symbolModelDao = unsafeUnwrapEitherRight(executeIo(createSymbolModelDao(client)));
    symbolModel = client.models[symbolModelName];
  });
  afterEach(() => symbolModel.deleteMany());
  afterEach(() => deleteModel(client, symbolModelName));

  describe('Generate ID', () => {
    it('WHEN generate ID THEN it should return a string with length more than 0', () => {
      const id = symbolModelDao.generateId();

      expect(id).toBeString();
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('Add symbol', () => {
    describe('WHEN successfully add a symbol', () => {
      it('THEN it should return Right of undefined', async () => {
        const result = await executeT(symbolModelDao.add(mockSymbol()));

        expect(result).toEqualRight(undefined);
      });
      it('THEN it should insert the symbol into database', async () => {
        const symbol = mockSymbol();
        await executeT(symbolModelDao.add(symbol));

        const findResult = await symbolModel.findById(symbol.id);
        expect(findResult).not.toBeNull();
      });
    });
    describe('WHEN successfully add multiple symbols at the same time', () => {
      it('THEN it should return Right of undefined', async () => {
        const symbols = generateArrayOf(mockSymbol);
        const result = await executeT(symbolModelDao.add(symbols));

        expect(result).toEqualRight(undefined);
      });
      it('THEN it should insert those symbols into database', async () => {
        const symbols = generateArrayOf(mockSymbol);
        await executeT(symbolModelDao.add(symbols));

        const idsList = symbols.map(prop('id'));
        const findResult = await symbolModel.find({ _id: { $in: idsList } });
        expect(findResult).toHaveLength(idsList.length);
      });
    });
    describe('WHEN add a new symbol with existed id', () => {
      it('THEN it should return Left of symbol repository error', async () => {
        const symbol = mockSymbol();
        await symbolModel.create(symbol);
        const symbol2 = mockSymbol();
        const result = await executeT(symbolModelDao.add({ ...symbol2, id: symbol.id }));

        expect(result).toEqualLeft(expect.toSatisfy(isSymbolModelDaoError));
      });
      it('THEN it should not add the symbol with duplicated id to database', async () => {
        const symbol = mockSymbol();
        await symbolModel.create(symbol);
        const symbol2 = mockSymbol();
        await executeT(symbolModelDao.add({ ...symbol2, id: symbol.id }));

        await expect(symbolModel.count({ _id: symbol.id })).resolves.toBe(1);
      });
    });
    describe('WHEN add a new symbol with existed combination of symbol name and exchange', () => {
      it('THEN it should return Left of symbol repository error', async () => {
        const symbol = mockSymbol();
        await symbolModel.create(symbol);
        const symbol2 = mockSymbol();
        const result = await executeT(
          symbolModelDao.add({ ...symbol2, name: symbol.name, exchange: symbol.exchange }),
        );

        expect(result).toEqualLeft(expect.toSatisfy(isSymbolModelDaoError));
      });
      it('THEN it should not add the symbol with duplicated combination to database', async () => {
        const symbol = mockSymbol();
        await symbolModel.create(symbol);
        const symbol2 = mockSymbol();
        await executeT(symbolModelDao.add({ ...symbol2, name: symbol.name, exchange: symbol.exchange }));

        await expect(symbolModel.count({ name: symbol.name, exchange: symbol.exchange })).resolves.toBe(1);
      });
    });
  });

  describe('Get all symbols', () => {
    describe('GIVEN there is no existing symbol WHEN get all symbols', () => {
      it('THEN it should return Right of an empty array', async () => {
        const getResult = await executeT(symbolModelDao.getAll);

        expect(getResult).toEqualRight([]);
      });
    });
    describe('GIVEN there is existing symbols WHEN get all symbols', () => {
      it('THEN it should return Right of an array with existing symbols', async () => {
        const symbols = generateArrayOf(() => mockSymbol({ version: 0 }));
        await symbolModel.insertMany(symbols);

        const getResult = await executeT(symbolModelDao.getAll);

        expect(getResult).toEqualRight(expect.toIncludeAllMembers(symbols));
      });
    });
  });

  describe('Check existence by exchange', () => {
    describe('GIVEN some symbol of the exchange already exists WHEN check existence by exchange', () => {
      it('THEN it should return Right of true', async () => {
        const symbol = mockSymbol();
        await symbolModel.create(symbol);

        const result = await executeT(symbolModelDao.existByExchange(symbol.exchange));

        expect(result).toEqualRight(true);
      });
    });
    describe('GIVEN the ID does not exist WHEN check existence by ID', () => {
      it('THEN it should return Right of false', async () => {
        const result = await executeT(symbolModelDao.existByExchange(randomExchangeName()));

        expect(result).toEqualRight(false);
      });
    });
  });
});
