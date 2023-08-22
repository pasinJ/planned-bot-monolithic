import { assoc, omit } from 'ramda';

import {
  anyString,
  negativeFloat,
  random9DigitsPositiveFloatWithRoundUp,
  randomPrecisionStep,
} from '#test-utils/faker.js';
import { mockMarketLotSizeFilter } from '#test-utils/mockEntity.js';

import { marketLotSizeFilterSchema } from './marketLotSizeFilter.entity.js';

const minQtyRange: [number, number] = [1, 10];
const maxQtyRange: [number, number] = [10, 20];
const validMarketLotSizeFilter = mockMarketLotSizeFilter(minQtyRange, maxQtyRange);

describe('Market lot size filter entity', () => {
  describe('type property', () => {
    it('WHEN type property is missing THEN the filter should be invalid', () => {
      expect(() => marketLotSizeFilterSchema.parse(omit(['type'], validMarketLotSizeFilter))).toThrow();
    });
    it('WHEN type property does not equal to MARKET_LOT_SIZE THEN the filter should be invalid', () => {
      expect(() =>
        marketLotSizeFilterSchema.parse(assoc('type', anyString(), validMarketLotSizeFilter)),
      ).toThrow();
    });
  });
  describe('minQty property', () => {
    it('WHEN minQty property is missing THEN the filter should be invalid', () => {
      expect(() => marketLotSizeFilterSchema.parse(omit(['minQty'], validMarketLotSizeFilter))).toThrow();
    });
    it('WHEN minQty property equals to zero THEN the filter should be invalid', () => {
      expect(() => marketLotSizeFilterSchema.parse(assoc('minQty', 0, validMarketLotSizeFilter))).toThrow();
    });
    it('WHEN minQty property is a negative number THEN the filter should be invalid', () => {
      expect(() =>
        marketLotSizeFilterSchema.parse(assoc('minQty', negativeFloat(), validMarketLotSizeFilter)),
      ).toThrow();
    });
    it('WHEN minQty property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp(minQtyRange);
      expect(
        marketLotSizeFilterSchema.parse(assoc('minQty', float9Digits, validMarketLotSizeFilter)),
      ).toHaveProperty('minQty', float8Digits);
    });
  });
  describe('maxQty property', () => {
    it('WHEN maxQty property is missing THEN the filter should be invalid', () => {
      expect(() => marketLotSizeFilterSchema.parse(omit(['maxQty'], validMarketLotSizeFilter))).toThrow();
    });
    it('WHEN maxQty property equals to zero THEN the filter should be invalid', () => {
      expect(() => marketLotSizeFilterSchema.parse(assoc('maxQty', 0, validMarketLotSizeFilter))).toThrow();
    });
    it('WHEN maxQty property is a negative number THEN the filter should be invalid', () => {
      expect(() =>
        marketLotSizeFilterSchema.parse(assoc('maxQty', negativeFloat(), validMarketLotSizeFilter)),
      ).toThrow();
    });
    it('WHEN maxQty property is less than minQty property THEN the filter should be invalid', () => {
      const lessThanMinQty = parseFloat(validMarketLotSizeFilter.minQty.toString().slice(0, -1));
      expect(() =>
        marketLotSizeFilterSchema.parse(assoc('maxQty', lessThanMinQty, validMarketLotSizeFilter)),
      ).toThrow();
    });
    it('WHEN maxQty property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp(maxQtyRange);
      expect(
        marketLotSizeFilterSchema.parse(assoc('maxQty', float9Digits, validMarketLotSizeFilter)),
      ).toHaveProperty('maxQty', float8Digits);
    });
  });
  describe('stepSize property', () => {
    it('WHEN stepSize property is missing THEN the filter should be invalid', () => {
      expect(() => marketLotSizeFilterSchema.parse(omit(['stepSize'], validMarketLotSizeFilter))).toThrow();
    });
    it('WHEN stepSize property equals to zero THEN the filter should be invalid', () => {
      expect(() => marketLotSizeFilterSchema.parse(assoc('stepSize', 0, validMarketLotSizeFilter))).toThrow();
    });
    it('WHEN stepSize property is a negative number THEN the filter should be invalid', () => {
      expect(() =>
        marketLotSizeFilterSchema.parse(assoc('stepSize', negativeFloat(), validMarketLotSizeFilter)),
      ).toThrow();
    });
    it('WHEN stepSize property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const precision9Digits = randomPrecisionStep([9, 9]);
      expect(
        marketLotSizeFilterSchema.parse(assoc('stepSize', precision9Digits, validMarketLotSizeFilter)),
      ).toHaveProperty('stepSize', precision9Digits * 10);
    });
  });
  describe('WHEN every property is valid', () => {
    it('THEN the filter should be valid', () => {
      expect(marketLotSizeFilterSchema.parse(validMarketLotSizeFilter)).toEqual(validMarketLotSizeFilter);
    });
  });
});
