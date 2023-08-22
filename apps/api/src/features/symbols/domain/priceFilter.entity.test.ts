import { assoc, omit } from 'ramda';

import {
  anyString,
  negativeFloat,
  random9DigitsPositiveFloatWithRoundUp,
  randomPrecisionStep,
} from '#test-utils/faker.js';
import { mockPriceFilter } from '#test-utils/mockEntity.js';

import { priceFilterSchema } from './priceFilter.entity.js';

const minPriceRange: [number, number] = [1, 10];
const maxPriceRange: [number, number] = [10, 20];
const validPriceFilter = mockPriceFilter(minPriceRange, maxPriceRange);

describe('Price filter entity', () => {
  describe('type property', () => {
    it('WHEN type property is missing THEN the filter should be invalid', () => {
      expect(() => priceFilterSchema.parse(omit(['type'], validPriceFilter))).toThrow();
    });
    it('WHEN type property does not equal to PRICE_FILTER THEN the filter should be invalid', () => {
      expect(() => priceFilterSchema.parse(assoc('type', anyString, validPriceFilter))).toThrow();
    });
  });
  describe('minPrice property', () => {
    it('WHEN minPrice property is missing THEN the filter should be invalid', () => {
      expect(() => priceFilterSchema.parse(omit(['minPrice'], validPriceFilter))).toThrow();
    });
    it('WHEN minPrice property equals to zero THEN the filter should be invalid', () => {
      expect(() => priceFilterSchema.parse(assoc('minPrice', 0, validPriceFilter))).toThrow();
    });
    it('WHEN minPrice property is a negative number THEN the filter should be invalid', () => {
      expect(() => priceFilterSchema.parse(assoc('minPrice', negativeFloat, validPriceFilter))).toThrow();
    });
    it('WHEN minPrice property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp(minPriceRange);
      expect(priceFilterSchema.parse(assoc('minPrice', float9Digits, validPriceFilter))).toHaveProperty(
        'minPrice',
        float8Digits,
      );
    });
  });
  describe('maxPrice property', () => {
    it('WHEN maxPrice property is missing THEN the filter should be invalid', () => {
      expect(() => priceFilterSchema.parse(omit(['maxPrice'], validPriceFilter))).toThrow();
    });
    it('WHEN maxPrice property equals to zero THEN the filter should be invalid', () => {
      expect(() => priceFilterSchema.parse(assoc('maxPrice', 0, validPriceFilter))).toThrow();
    });
    it('WHEN maxPrice property is a negative number THEN the filter should be invalid', () => {
      expect(() => priceFilterSchema.parse(assoc('maxPrice', negativeFloat, validPriceFilter))).toThrow();
    });
    it('WHEN maxPrice property is less than minPrice property THEN the filter should be invalid', () => {
      const lessThanMinPrice = parseFloat(validPriceFilter.minPrice.toString().slice(0, -1));
      expect(() => priceFilterSchema.parse(assoc('maxPrice', lessThanMinPrice, validPriceFilter))).toThrow();
    });
    it('WHEN maxPrice property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp(maxPriceRange);
      expect(priceFilterSchema.parse(assoc('maxPrice', float9Digits, validPriceFilter))).toHaveProperty(
        'maxPrice',
        float8Digits,
      );
    });
  });
  describe('tickSize property', () => {
    it('WHEN tickSize property is missing THEN the filter should be invalid', () => {
      expect(() => priceFilterSchema.parse(omit(['tickSize'], validPriceFilter))).toThrow();
    });
    it('WHEN tickSize property equals to zero THEN the filter should be invalid', () => {
      expect(() => priceFilterSchema.parse(assoc('tickSize', 0, validPriceFilter))).toThrow();
    });
    it('WHEN tickSize property is a negative number THEN the filter should be invalid', () => {
      expect(() => priceFilterSchema.parse(assoc('tickSize', negativeFloat, validPriceFilter))).toThrow();
    });
    it('WHEN tickSize property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const precision9Digits = randomPrecisionStep([9, 9]);
      expect(priceFilterSchema.parse(assoc('tickSize', precision9Digits, validPriceFilter))).toHaveProperty(
        'tickSize',
        precision9Digits * 10,
      );
    });
  });
  describe('WHEN every property is valid', () => {
    it('THEN the filter should be valid', () => {
      expect(priceFilterSchema.parse(validPriceFilter)).toEqual(validPriceFilter);
    });
  });
});
