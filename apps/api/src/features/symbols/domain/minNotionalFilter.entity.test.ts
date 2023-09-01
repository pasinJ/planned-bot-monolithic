import { assoc, omit } from 'ramda';

import {
  random9DigitsPositiveFloatWithRoundUp,
  randomAnyFloat,
  randomNegativeFloat,
  randomNegativeInt,
  randomString,
} from '#test-utils/faker.js';
import { mockMinNotionalFilter } from '#test-utils/features/symbols/entities.js';

import { minNotionalFilterSchema } from './minNotionalFilter.entity.js';

const validMinNotionalFilter = mockMinNotionalFilter();

describe('Market lot size filter entity', () => {
  describe('type property', () => {
    it('WHEN type property is missing THEN the filter should be invalid', () => {
      expect(() => minNotionalFilterSchema.parse(omit(['type'], validMinNotionalFilter))).toThrow();
    });
    it('WHEN type property does not equal to MIN_NOTIONAL THEN the filter should be invalid', () => {
      expect(() =>
        minNotionalFilterSchema.parse(assoc('type', randomString(), validMinNotionalFilter)),
      ).toThrow();
    });
  });
  describe('minNotional property', () => {
    it('WHEN minNotional property is missing THEN the filter should be invalid', () => {
      expect(() => minNotionalFilterSchema.parse(omit(['minNotional'], validMinNotionalFilter))).toThrow();
    });
    it('WHEN minNotional property equals to zero THEN the filter should be invalid', () => {
      expect(() => minNotionalFilterSchema.parse(assoc('minNotional', 0, validMinNotionalFilter))).toThrow();
    });
    it('WHEN minNotional property is a negative number THEN the filter should be invalid', () => {
      expect(() =>
        minNotionalFilterSchema.parse(assoc('minNotional', randomNegativeFloat(), validMinNotionalFilter)),
      ).toThrow();
    });
    it('WHEN minNotional property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp();
      expect(
        minNotionalFilterSchema.parse(assoc('minNotional', float9Digits, validMinNotionalFilter)),
      ).toHaveProperty('minNotional', float8Digits);
    });
  });
  describe('applyToMarket property', () => {
    it('WHEN applyToMarket property is missing THEN the filter should be invalid', () => {
      expect(() => minNotionalFilterSchema.parse(omit(['applyToMarket'], validMinNotionalFilter))).toThrow();
    });
    it('WHEN applyToMarket property is not a boolean THEN the filter should be invalid', () => {
      expect(() =>
        minNotionalFilterSchema.parse(assoc('applyToMarket', randomString(), validMinNotionalFilter)),
      ).toThrow();
    });
  });
  describe('avgPriceMins property', () => {
    it('WHEN avgPriceMins property is missing THEN the filter should be invalid', () => {
      expect(() => minNotionalFilterSchema.parse(omit(['avgPriceMins'], validMinNotionalFilter))).toThrow();
    });
    it('WHEN avgPriceMins property is a float number THEN the filter should be invalid', () => {
      expect(() =>
        minNotionalFilterSchema.parse(assoc('avgPriceMins', randomAnyFloat(), validMinNotionalFilter)),
      ).toThrow();
    });
    it('WHEN avgPriceMins property is a negative number THEN the filter should be invalid', () => {
      expect(() =>
        minNotionalFilterSchema.parse(assoc('avgPriceMins', randomNegativeInt(), validMinNotionalFilter)),
      ).toThrow();
    });
    it('WHEN avgPriceMins property equals to zero THEN the filter should be valid', () => {
      expect(() =>
        minNotionalFilterSchema.parse(assoc('avgPriceMins', 0, validMinNotionalFilter)),
      ).not.toThrow();
    });
  });
  describe('WHEN every property is valid', () => {
    it('THEN the filter should be valid', () => {
      expect(minNotionalFilterSchema.parse(validMinNotionalFilter)).toEqual(validMinNotionalFilter);
    });
  });
});
