import { Schema } from 'mongoose';
import { prop } from 'ramda';

import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { generateArrayOf } from '#test-utils/faker.js';
import { mockSymbol } from '#test-utils/features/symbols/entities.js';
import { createMongoClient, deleteModel } from '#test-utils/mongoDb.js';

import { isSymbolRepoError } from './symbol.error.js';
import { createSymbolRepo } from './symbol.js';
import { SymbolModel, symbolModelName } from './symbol.model.js';
import { SymbolRepo } from './symbol.type.js';

const client = await createMongoClient();

afterAll(() => client.disconnect());

describe('Create symbol repository', () => {
  afterEach(() => deleteModel(client, symbolModelName));

  describe('WHEN successfully create symbol repository', () => {
    it('THEN it should return Right of symbol repository', () => {
      const repository = executeIo(createSymbolRepo(client));
      expect(repository).toEqualRight(expect.toContainAllKeys(['generateId', 'add', 'countAll', 'getAll']));
    });
  });
  describe('WHEN unsuccessfully create symbol repository (duplicated model)', () => {
    it('THEN it should return Left of symbol repository error', () => {
      client.model(symbolModelName, new Schema({}));
      const repository = executeIo(createSymbolRepo(client));
      expect(repository).toEqualLeft(expect.toSatisfy(isSymbolRepoError));
    });
  });
});

describe('Generate ID', () => {
  afterAll(() => deleteModel(client, symbolModelName));

  it('WHEN generate ID THEN it should return a string with length more than 0', () => {
    const repository = unsafeUnwrapEitherRight(executeIo(createSymbolRepo(client)));

    const id = repository.generateId();
    expect(id).toBeString();
    expect(id.length).toBeGreaterThan(0);
  });
});

describe('Add new symbols', () => {
  let symbolRepo: SymbolRepo;
  let symbolModel: SymbolModel;

  function setupRepo() {
    symbolRepo = unsafeUnwrapEitherRight(executeIo(createSymbolRepo(client)));
    symbolModel = client.models[symbolModelName];
  }

  beforeAll(() => setupRepo());
  afterEach(() => symbolModel.deleteMany());
  afterAll(() => deleteModel(client, symbolModelName));

  describe('WHEN successfully add a new symbol', () => {
    it('THEN it should return Right', async () => {
      const result = await executeT(symbolRepo.add(mockSymbol()));

      expect(result).toBeRight();
    });
    it('THEN it should insert a new symbol into database', async () => {
      const symbol = mockSymbol();
      await executeT(symbolRepo.add(symbol));

      const findResult = await symbolModel.findById(symbol.id);
      expect(findResult).not.toBeNull();
    });
  });
  describe('WHEN successfully add multiple symbols at the same time', () => {
    it('THEN it should return Right', async () => {
      const symbols = generateArrayOf(mockSymbol);
      const result = await executeT(symbolRepo.add(symbols));

      expect(result).toBeRight();
    });
    it('THEN it should insert those symbols into database', async () => {
      const symbols = generateArrayOf(mockSymbol);
      await executeT(symbolRepo.add(symbols));

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
      const result = await executeT(symbolRepo.add({ ...symbol2, id: symbol.id }));

      expect(result).toEqualLeft(expect.toSatisfy(isSymbolRepoError));
    });
    it('THEN it should not add the symbol with duplicated id to database', async () => {
      const symbol = mockSymbol();
      await symbolModel.create(symbol);
      const symbol2 = mockSymbol();
      await executeT(symbolRepo.add({ ...symbol2, id: symbol.id }));

      await expect(symbolModel.count({ _id: symbol.id })).resolves.toBe(1);
    });
  });
  describe('WHEN add a new symbol with existed combination of symbol name and exchange', () => {
    it('THEN it should return Left of symbol repository error', async () => {
      const symbol = mockSymbol();
      await symbolModel.create(symbol);
      const symbol2 = mockSymbol();
      const result = await executeT(
        symbolRepo.add({ ...symbol2, name: symbol.name, exchange: symbol.exchange }),
      );

      expect(result).toEqualLeft(expect.toSatisfy(isSymbolRepoError));
    });
    it('THEN it should not add the symbol with duplicated id to database', async () => {
      const symbol = mockSymbol();
      await symbolModel.create(symbol);
      const symbol2 = mockSymbol();
      await executeT(symbolRepo.add({ ...symbol2, name: symbol.name, exchange: symbol.exchange }));

      await expect(symbolModel.count({ name: symbol.name, exchange: symbol.exchange })).resolves.toBe(1);
    });
  });
});

describe('Get all symbols', () => {
  let symbolRepo: SymbolRepo;
  let symbolModel: SymbolModel;

  function setupRepo() {
    symbolRepo = unsafeUnwrapEitherRight(executeIo(createSymbolRepo(client)));
    symbolModel = client.models[symbolModelName];
  }

  beforeAll(() => setupRepo());
  afterEach(() => symbolModel.deleteMany());
  afterAll(() => deleteModel(client, symbolModelName));

  describe('GIVEN there is no existing symbol WHEN get all symbols', () => {
    it('THEN it should return Right of an empty array', async () => {
      const getResult = await executeT(symbolRepo.getAll);

      expect(getResult).toEqualRight([]);
    });
  });
  describe('GIVEN there is existing symbols WHEN get all symbols', () => {
    it('THEN it should return Right of an array with existing symbols', async () => {
      const symbols = generateArrayOf(() => mockSymbol({ version: 0 }));
      await symbolModel.insertMany(symbols);

      const getResult = await executeT(symbolRepo.getAll);

      expect(getResult).toEqualRight(expect.toIncludeAllMembers(symbols));
    });
  });
});

describe('Count all symbols', () => {
  let symbolRepo: SymbolRepo;
  let symbolModel: SymbolModel;

  function setupRepo() {
    symbolRepo = unsafeUnwrapEitherRight(executeIo(createSymbolRepo(client)));
    symbolModel = client.models[symbolModelName];
  }

  beforeAll(() => setupRepo());
  afterEach(() => symbolModel.deleteMany());
  afterAll(() => deleteModel(client, symbolModelName));

  describe('GIVEN there is no symbol in database WHEN count all symbols', () => {
    it('THEN it should return Right of zero', async () => {
      const result = await executeT(symbolRepo.countAll);

      expect(result).toEqualRight(0);
    });
  });
  describe('GIVEN there is existing symbols WHEN count all symbols', () => {
    it('THEN it should return Right of the number of existing symbols', async () => {
      const symbols = generateArrayOf(mockSymbol);
      await symbolModel.insertMany(symbols);
      const result = await executeT(symbolRepo.countAll);

      expect(result).toEqualRight(symbols.length);
    });
  });
});
