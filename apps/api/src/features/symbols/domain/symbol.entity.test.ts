import { faker } from '@faker-js/faker';
import { append, assoc, modify, omit, pick } from 'ramda';

import { exchangeNameEnum } from '#features/exchanges/domain/exchange.js';
import {
  invalidDate,
  randomAnyFloat,
  randomDateBefore,
  randomNegativeInt,
  randomString,
} from '#test-utils/faker.js';
import { mockSymbol } from '#test-utils/features/symbols/entities.js';

import { createSymbol, symbolSchema } from './symbol.entity.js';
import { isSymbolDomainError } from './symbol.error.js';

const validSymbol = mockSymbol();

describe('Symbol entity', () => {
  describe('id property', () => {
    it('WHEN id property is missing THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(omit(['id'], validSymbol))).toThrow();
    });
    it('WHEN id property is an empty string THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('id', '', validSymbol))).toThrow();
    });
    it('WHEN id property is a string with only whitespace THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('id', ' ', validSymbol))).toThrow();
    });
  });
  describe('name property', () => {
    it('WHEN name property is missing THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(omit(['name'], validSymbol))).toThrow();
    });
    it('WHEN name property is an empty string THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('name', '', validSymbol))).toThrow();
    });
    it('WHEN name property is a string with only whitespace THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('name', ' ', validSymbol))).toThrow();
    });
  });
  describe('exchange property', () => {
    it('WHEN exchange property is missing THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(omit(['exchange'], validSymbol))).toThrow();
    });
    it('WHEN exchange property does not match enum list THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('exchange', randomString(), validSymbol))).toThrow();
    });
  });
  describe('baseAsset property', () => {
    it('WHEN baseAsset property is missing THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(omit(['baseAsset'], validSymbol))).toThrow();
    });
    it('WHEN baseAsset property is an empty string THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('baseAsset', '', validSymbol))).toThrow();
    });
    it('WHEN baseAsset property is a string with only whitespace THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('baseAsset', ' ', validSymbol))).toThrow();
    });
  });
  describe('baseAssetPrecision property', () => {
    it('WHEN baseAssetPrecision property is missing THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(omit(['baseAssetPrecision'], validSymbol))).toThrow();
    });
    it('WHEN baseAssetPrecision property is a float number THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('baseAssetPrecision', randomAnyFloat(), validSymbol))).toThrow();
    });
    it('WHEN baseAssetPrecision property is a negative number THEN the symbol should be invalid', () => {
      expect(() =>
        symbolSchema.parse(assoc('baseAssetPrecision', randomNegativeInt(), validSymbol)),
      ).toThrow();
    });
  });
  describe('quoteAsset property', () => {
    it('WHEN quoteAsset property is missing THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(omit(['quoteAsset'], validSymbol))).toThrow();
    });
    it('WHEN quoteAsset property is an empty string THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('quoteAsset', '', validSymbol))).toThrow();
    });
    it('WHEN quoteAsset property is a string with only whitespace THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('quoteAsset', ' ', validSymbol))).toThrow();
    });
  });
  describe('quoteAssetPrecision property', () => {
    it('WHEN quoteAssetPrecision property is missing THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(omit(['quoteAssetPrecision'], validSymbol))).toThrow();
    });
    it('WHEN quoteAssetPrecision property is a float number THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('quoteAssetPrecision', randomAnyFloat(), validSymbol))).toThrow();
    });
    it('WHEN quoteAssetPrecision property is a negative number THEN the symbol should be invalid', () => {
      expect(() =>
        symbolSchema.parse(assoc('quoteAssetPrecision', randomNegativeInt(), validSymbol)),
      ).toThrow();
    });
  });
  describe('orderTypes property', () => {
    it('WHEN orderTypes property is missing THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(omit(['orderTypes'], validSymbol))).toThrow();
    });
    it('WHEN orderTypes property includes a element that does not match enum list THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(modify('orderTypes', append(randomString()), validSymbol))).toThrow();
    });
  });
  describe('filters property', () => {
    it('WHEN filters property is missing THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(omit(['filters'], validSymbol))).toThrow();
    });
    it('WHEN filters property includes an invalid filter THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(modify('filters', append({}), validSymbol))).toThrow();
    });
    it('WHEN filters property includes duplicated filter type THEN the symbol should be invalid', () => {
      const duplicatedFilter = [...validSymbol.filters, faker.helpers.arrayElement(validSymbol.filters)];
      expect(() => symbolSchema.parse(assoc('filters', duplicatedFilter, validSymbol))).toThrow();
    });
    it('WHEN filters property is an empty array THEN the symbol should be valid', () => {
      expect(() => symbolSchema.parse(assoc('filters', [], validSymbol))).not.toThrow();
    });
  });
  describe('version property', () => {
    it('WHEN version property is missing THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(omit(['version'], validSymbol))).toThrow();
    });
    it('WHEN version property is a float number THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('version', randomAnyFloat(), validSymbol))).toThrow();
    });
    it('WHEN version property is a negative number THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('version', randomNegativeInt(), validSymbol))).toThrow();
    });
  });
  describe('createdAt property', () => {
    it('WHEN createdAt property is missing THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(omit(['createdAt'], validSymbol))).toThrow();
    });
    it('WHEN createdAt property is an invalid date THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('createdAt', invalidDate, validSymbol))).toThrow();
    });
  });
  describe('updatedAt property', () => {
    it('WHEN updatedAt property is missing THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(omit(['updatedAt'], validSymbol))).toThrow();
    });
    it('WHEN updatedAt property is an invalid date THEN the symbol should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('updatedAt', invalidDate, validSymbol))).toThrow();
    });
    it('WHEN updatedAt property is a date before createdAt THEN the symbol should be invalid', () => {
      const dateBefore = randomDateBefore(validSymbol.createdAt);
      expect(() => symbolSchema.parse(assoc('updatedAt', dateBefore, validSymbol))).toThrow();
    });
  });
  describe('WHEN every property is valid', () => {
    it('THEN the symbol should be valid', () => {
      expect(symbolSchema.parse(validSymbol)).toEqual(validSymbol);
    });
  });
});

describe('Create symbol entity', () => {
  describe('WHEN successfully create symbol entity', () => {
    it('THEN it should return Right of symbol', () => {
      const input = pick(
        [
          'id',
          'name',
          'baseAsset',
          'baseAssetPrecision',
          'quoteAsset',
          'quoteAssetPrecision',
          'orderTypes',
          'filters',
        ],
        mockSymbol(),
      );
      const currentDate = faker.date.anytime();
      const result = createSymbol(input, currentDate);

      expect(result).toEqualRight({
        ...input,
        exchange: exchangeNameEnum.BINANCE,
        version: 0,
        createdAt: currentDate,
        updatedAt: currentDate,
      });
    });
  });
  describe('WHEN creating symbol entity failed', () => {
    it('THEN it should return Left of symbol domain error', () => {
      const input = pick(
        [
          'id',
          'name',
          'baseAsset',
          'baseAssetPrecision',
          'quoteAsset',
          'quoteAssetPrecision',
          'orderTypes',
          'filters',
        ],
        mockSymbol(),
      );
      const result = createSymbol({ ...input, baseAssetPrecision: -1 }, faker.date.anytime());

      expect(result).toEqualLeft(expect.toSatisfy(isSymbolDomainError));
    });
  });
});
