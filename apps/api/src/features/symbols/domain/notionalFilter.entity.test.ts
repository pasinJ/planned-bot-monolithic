import { assoc, omit } from 'ramda';

import {
  anyFloat,
  anyString,
  negativeFloat,
  random9DigitsPositiveFloatWithRoundUp,
  randomNegativeInt,
} from '#test-utils/faker.js';
import { mockNotionalFilter } from '#test-utils/mockEntity.js';

import { notionalFilterSchema } from './notionalFilter.entity.js';

const validNotionalFilter = mockNotionalFilter();

describe('Market lot size filter entity', () => {
  describe('type property', () => {
    it('WHEN type property is missing THEN the filter should be invalid', () => {
      expect(() => notionalFilterSchema.parse(omit(['type'], validNotionalFilter))).toThrow();
    });
    it('WHEN type property does not equal to NOTIONAL THEN the filter should be invalid', () => {
      expect(() => notionalFilterSchema.parse(assoc('type', anyString(), validNotionalFilter))).toThrow();
    });
  });
  describe('minNotional property', () => {
    it('WHEN minNotional property is missing THEN the filter should be invalid', () => {
      expect(() => notionalFilterSchema.parse(omit(['minNotional'], validNotionalFilter))).toThrow();
    });
    it('WHEN minNotional property equals to zero THEN the filter should be invalid', () => {
      expect(() => notionalFilterSchema.parse(assoc('minNotional', 0, validNotionalFilter))).toThrow();
    });
    it('WHEN minNotional property is a negative number THEN the filter should be invalid', () => {
      expect(() =>
        notionalFilterSchema.parse(assoc('minNotional', negativeFloat(), validNotionalFilter)),
      ).toThrow();
    });
    it('WHEN minNotional property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp();
      expect(
        notionalFilterSchema.parse(assoc('minNotional', float9Digits, validNotionalFilter)),
      ).toHaveProperty('minNotional', float8Digits);
    });
  });
  describe('applyMinToMarket property', () => {
    it('WHEN applyMinToMarket property is missing THEN the filter should be invalid', () => {
      expect(() => notionalFilterSchema.parse(omit(['applyMinToMarket'], validNotionalFilter))).toThrow();
    });
    it('WHEN applyMinToMarket property is not a boolean THEN the filter should be invalid', () => {
      expect(() =>
        notionalFilterSchema.parse(assoc('applyMinToMarket', anyString(), validNotionalFilter)),
      ).toThrow();
    });
  });
  describe('maxNotional property', () => {
    it('WHEN maxNotional property is missing THEN the filter should be invalid', () => {
      expect(() => notionalFilterSchema.parse(omit(['maxNotional'], validNotionalFilter))).toThrow();
    });
    it('WHEN maxNotional property equals to zero THEN the filter should be invalid', () => {
      expect(() => notionalFilterSchema.parse(assoc('maxNotional', 0, validNotionalFilter))).toThrow();
    });
    it('WHEN maxNotional property is a negative number THEN the filter should be invalid', () => {
      expect(() =>
        notionalFilterSchema.parse(assoc('maxNotional', negativeFloat(), validNotionalFilter)),
      ).toThrow();
    });
    it('WHEN maxNotional property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp();
      expect(
        notionalFilterSchema.parse(assoc('maxNotional', float9Digits, validNotionalFilter)),
      ).toHaveProperty('maxNotional', float8Digits);
    });
  });
  describe('applyMaxToMarket property', () => {
    it('WHEN applyMaxToMarket property is missing THEN the filter should be invalid', () => {
      expect(() => notionalFilterSchema.parse(omit(['applyMaxToMarket'], validNotionalFilter))).toThrow();
    });
    it('WHEN applyMaxToMarket property is not a boolean THEN the filter should be invalid', () => {
      expect(() =>
        notionalFilterSchema.parse(assoc('applyMaxToMarket', anyString(), validNotionalFilter)),
      ).toThrow();
    });
  });
  describe('avgPriceMins property', () => {
    it('WHEN avgPriceMins property is missing THEN the filter should be invalid', () => {
      expect(() => notionalFilterSchema.parse(omit(['avgPriceMins'], validNotionalFilter))).toThrow();
    });
    it('WHEN avgPriceMins property is a float number THEN the filter should be invalid', () => {
      expect(() =>
        notionalFilterSchema.parse(assoc('avgPriceMins', anyFloat(), validNotionalFilter)),
      ).toThrow();
    });
    it('WHEN avgPriceMins property is a negative number THEN the filter should be invalid', () => {
      expect(() =>
        notionalFilterSchema.parse(assoc('avgPriceMins', randomNegativeInt(), validNotionalFilter)),
      ).toThrow();
    });
    it('WHEN avgPriceMins property equals to zero THEN the filter should be valid', () => {
      expect(() => notionalFilterSchema.parse(assoc('avgPriceMins', 0, validNotionalFilter))).not.toThrow();
    });
  });
  describe('WHEN every property is valid', () => {
    it('THEN the filter should be valid', () => {
      expect(notionalFilterSchema.parse(validNotionalFilter)).toEqual(validNotionalFilter);
    });
  });
});
