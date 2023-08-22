import { assoc, omit } from 'ramda';

import {
  anyFloat,
  anyString,
  negativeFloat,
  negativeInt,
  random9DigitsPositiveFloatWithRoundUp,
} from '#test-utils/faker.js';
import { mockMinNotionalFilter } from '#test-utils/mockEntity.js';

import { minNotionalFilterSchema } from './minNotionalFilter.entity.js';

const validMinNotionalFilter = mockMinNotionalFilter();

describe('Market lot size filter entity', () => {
  describe('type property', () => {
    it('WHEN type property is missing THEN the filter should be invalid', () => {
      expect(() => minNotionalFilterSchema.parse(omit(['type'], validMinNotionalFilter))).toThrow();
    });
    it('WHEN type property does not equal to MIN_NOTIONAL THEN the filter should be invalid', () => {
      expect(() => minNotionalFilterSchema.parse(assoc('type', anyString, validMinNotionalFilter))).toThrow();
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
        minNotionalFilterSchema.parse(assoc('minNotional', negativeFloat, validMinNotionalFilter)),
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
        minNotionalFilterSchema.parse(assoc('applyToMarket', anyString, validMinNotionalFilter)),
      ).toThrow();
    });
  });
  describe('avgPriceMins property', () => {
    it('WHEN avgPriceMins property is missing THEN the filter should be invalid', () => {
      expect(() => minNotionalFilterSchema.parse(omit(['avgPriceMins'], validMinNotionalFilter))).toThrow();
    });
    it('WHEN avgPriceMins property is a float number THEN the filter should be invalid', () => {
      expect(() =>
        minNotionalFilterSchema.parse(assoc('avgPriceMins', anyFloat, validMinNotionalFilter)),
      ).toThrow();
    });
    it('WHEN avgPriceMins property is a negative number THEN the filter should be invalid', () => {
      expect(() =>
        minNotionalFilterSchema.parse(assoc('avgPriceMins', negativeInt, validMinNotionalFilter)),
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
