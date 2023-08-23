import { faker } from '@faker-js/faker';
import eUtils from 'fp-ts-std/Either';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Schema } from 'mongoose';
import { is, prop } from 'ramda';

import { executeIo, executeT } from '#shared/utils/fp.js';
import { mockSymbol } from '#test-utils/mockEntity.js';
import { createMongoClient, deleteModel } from '#test-utils/mockRepository.js';

import { SymbolModel, symbolModelName } from './symbol.model.js';
import { createSymbolRepository, getSymbolRepository } from './symbol.repository.js';
import { CreateSymbolRepositoryError, SymbolRepository } from './symbol.repository.type.js';

const client = await createMongoClient();

afterAll(() => client.disconnect());

describe('Create symbol repository', () => {
  afterEach(() => deleteModel(client, symbolModelName));

  describe('WHEN successfully create symbol repository', () => {
    it('THEN it should return Right of symbol repository', () => {
      const repository = executeIo(createSymbolRepository(client));
      expect(repository).toEqualRight(expect.toContainAllKeys(['add', 'countAll', 'getAll']));
    });
  });
  describe('WHEN unsuccessfully create symbol repository (duplicated model)', () => {
    it('THEN it should return Left of error', () => {
      client.model(symbolModelName, new Schema({}));
      const repository = executeIo(createSymbolRepository(client));
      expect(repository).toEqualLeft(expect.toSatisfy(is(CreateSymbolRepositoryError)));
    });
  });
});

describe('Get symbol repository', () => {
  afterEach(() => deleteModel(client, symbolModelName));

  describe('GIVEN symbol repository has not been initiated WHEN get symbol repository', () => {
    it('THEN it should return Left of NOT_INITIATED_ERROR', async () => {
      jest.resetModules();
      const { getSymbolRepository } = await import('./symbol.repository.js');
      const repository = executeIo(getSymbolRepository);
      expect(repository).toSubsetEqualLeft({ name: 'NOT_INITIATED_ERROR', message: expect.any(String) });
    });
  });
  describe('GIVEN symbol repository has been initiated WHEN get symbol repository', () => {
    it('THEN it should return Right of symbol repository', () => {
      const repository = pipe(
        createSymbolRepository(client),
        ioe.chainW(() => getSymbolRepository),
        executeIo,
      );
      expect(repository).toEqualRight(expect.toContainAllKeys(['add', 'countAll', 'getAll']));
    });
  });
});

describe('Add new symbols', () => {
  let symbolRepository: SymbolRepository;
  let symbolModel: SymbolModel;

  function setupRepository() {
    symbolRepository = eUtils.unsafeUnwrap(
      pipe(
        createSymbolRepository(client),
        ioe.chainW(() => getSymbolRepository),
        executeIo,
      ),
    );
    symbolModel = client.models[symbolModelName];
  }

  beforeAll(() => setupRepository());
  afterEach(() => symbolModel.deleteMany());
  afterAll(() => deleteModel(client, symbolModelName));

  describe('WHEN successfully add a new symbol', () => {
    it('THEN it should return Right', async () => {
      const symbol = mockSymbol();
      const result = await executeT(symbolRepository.add(symbol));

      expect(result).toBeRight();
    });
    it('THEN it should insert a new symbol into database', async () => {
      const symbol = mockSymbol();
      await executeT(symbolRepository.add(symbol));

      const findResult = await symbolModel.findById(symbol.id);
      expect(findResult).not.toBeNull();
    });
  });
  describe('WHEN successfully add multiple symbols at the same time', () => {
    it('THEN it should return Right', async () => {
      const symbols = faker.helpers.multiple(mockSymbol, { count: 2 });
      const result = await executeT(symbolRepository.add(symbols));

      expect(result).toBeRight();
    });
    it('THEN it should insert those symbols into database', async () => {
      const symbols = faker.helpers.multiple(mockSymbol, { count: 2 });
      await executeT(symbolRepository.add(symbols));

      const idsList = symbols.map(prop('id'));
      const findResult = await symbolModel.find({ _id: { $in: idsList } });
      expect(findResult).toHaveLength(idsList.length);
    });
  });
  describe('WHEN add a new symbol with existed id', () => {
    it('THEN it should return Left of ADD_SYMBOLS_ERROR', async () => {
      const symbol = mockSymbol();
      await symbolModel.create(symbol);
      const symbol2 = mockSymbol();
      const result = await executeT(symbolRepository.add({ ...symbol2, id: symbol.id }));

      expect(result).toSubsetEqualLeft({ name: 'ADD_SYMBOLS_ERROR' });
    });
    it('THEN it should not add the symbol with duplicated id to database', async () => {
      const symbol = mockSymbol();
      await symbolModel.create(symbol);
      const symbol2 = mockSymbol();
      await executeT(symbolRepository.add({ ...symbol2, id: symbol.id }));

      await expect(symbolModel.count({ _id: symbol.id })).resolves.toBe(1);
    });
  });
  describe('WHEN add a new symbol with existed combination of symbol name and exchange', () => {
    it('THEN it should return Left of ADD_SYMBOLS_ERROR', async () => {
      const symbol = mockSymbol();
      await symbolModel.create(symbol);
      const symbol2 = mockSymbol();
      const result = await executeT(
        symbolRepository.add({ ...symbol2, name: symbol.name, exchange: symbol.exchange }),
      );

      expect(result).toSubsetEqualLeft({ name: 'ADD_SYMBOLS_ERROR' });
    });
    it('THEN it should not add the symbol with duplicated id to database', async () => {
      const symbol = mockSymbol();
      await symbolModel.create(symbol);
      const symbol2 = mockSymbol();
      await executeT(symbolRepository.add({ ...symbol2, name: symbol.name, exchange: symbol.exchange }));

      await expect(symbolModel.count({ name: symbol.name, exchange: symbol.exchange })).resolves.toBe(1);
    });
  });
});

describe('Get all symbols', () => {
  let symbolRepository: SymbolRepository;
  let symbolModel: SymbolModel;

  function setupRepository() {
    symbolRepository = eUtils.unsafeUnwrap(
      pipe(
        createSymbolRepository(client),
        ioe.chainW(() => getSymbolRepository),
        executeIo,
      ),
    );
    symbolModel = client.models[symbolModelName];
  }

  beforeAll(() => setupRepository());
  afterEach(() => symbolModel.deleteMany());
  afterAll(() => deleteModel(client, symbolModelName));

  describe('GIVEN there is no existing symbol WHEN get all symbols', () => {
    it('THEN it should return Right of an empty array', async () => {
      const getResult = await executeT(symbolRepository.getAll);

      expect(getResult).toEqualRight([]);
    });
  });
  describe('GIVEN there is existing symbols WHEN get all symbols', () => {
    it('THEN it should return Right of an array with existing symbols', async () => {
      const symbols = faker.helpers.multiple(() => mockSymbol({ version: 0 }), { count: 2 });
      await symbolModel.insertMany(symbols);

      const getResult = await executeT(symbolRepository.getAll);

      expect(getResult).toEqualRight(expect.toIncludeAllMembers(symbols));
    });
  });
});

describe('Count all symbols', () => {
  let symbolRepository: SymbolRepository;
  let symbolModel: SymbolModel;

  function setupRepository() {
    symbolRepository = eUtils.unsafeUnwrap(
      pipe(
        createSymbolRepository(client),
        ioe.chainW(() => getSymbolRepository),
        executeIo,
      ),
    );
    symbolModel = client.models[symbolModelName];
  }

  beforeAll(() => setupRepository());
  afterEach(() => symbolModel.deleteMany());
  afterAll(() => deleteModel(client, symbolModelName));

  describe('GIVEN there is no symbol in database WHEN count all symbols', () => {
    it('THEN it should return Right of zero', async () => {
      const result = await executeT(symbolRepository.countAll);

      expect(result).toEqualRight(0);
    });
  });
  describe('GIVEN there is existing symbols WHEN count all symbols', () => {
    it('THEN it should return Right of the number of existing symbols', async () => {
      const symbols = faker.helpers.multiple(mockSymbol, { count: 2 });
      await symbolModel.insertMany(symbols);
      const result = await executeT(symbolRepository.countAll);

      expect(result).toEqualRight(symbols.length);
    });
  });
});
