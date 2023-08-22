import { assoc, omit } from 'ramda';

import {
  anyString,
  negativeFloat,
  random9DigitsPositiveFloatWithRoundUp,
  randomPrecisionStep,
} from '#test-utils/faker.js';
import { mockLotSizeFilter } from '#test-utils/mockEntity.js';

import { lotSizeFilterSchema } from './lotSizeFilter.entity.js';

const minQtyRange: [number, number] = [1, 10];
const maxQtyRange: [number, number] = [10, 20];
const validLotSizeFilter = mockLotSizeFilter(minQtyRange, maxQtyRange);

describe('Lot size filter entity', () => {
  describe('type property', () => {
    it('WHEN type property is missing THEN the filter should be invalid', () => {
      expect(() => lotSizeFilterSchema.parse(omit(['type'], validLotSizeFilter))).toThrow();
    });
    it('WHEN type property does not equal to LOT_SIZE THEN the filter should be invalid', () => {
      expect(() => lotSizeFilterSchema.parse(assoc('type', anyString, validLotSizeFilter))).toThrow();
    });
  });
  describe('minQty property', () => {
    it('WHEN minQty property is missing THEN the filter should be invalid', () => {
      expect(() => lotSizeFilterSchema.parse(omit(['minQty'], validLotSizeFilter))).toThrow();
    });
    it('WHEN minQty property equals to zero THEN the filter should be invalid', () => {
      expect(() => lotSizeFilterSchema.parse(assoc('minQty', 0, validLotSizeFilter))).toThrow();
    });
    it('WHEN minQty property is a negative number THEN the filter should be invalid', () => {
      expect(() => lotSizeFilterSchema.parse(assoc('minQty', negativeFloat, validLotSizeFilter))).toThrow();
    });
    it('WHEN minQty property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp(minQtyRange);
      expect(lotSizeFilterSchema.parse(assoc('minQty', float9Digits, validLotSizeFilter))).toHaveProperty(
        'minQty',
        float8Digits,
      );
    });
  });
  describe('maxQty property', () => {
    it('WHEN maxQty property is missing THEN the filter should be invalid', () => {
      expect(() => lotSizeFilterSchema.parse(omit(['maxQty'], validLotSizeFilter))).toThrow();
    });
    it('WHEN maxQty property equals to zero THEN the filter should be invalid', () => {
      expect(() => lotSizeFilterSchema.parse(assoc('maxQty', 0, validLotSizeFilter))).toThrow();
    });
    it('WHEN maxQty property is a negative number THEN the filter should be invalid', () => {
      expect(() => lotSizeFilterSchema.parse(assoc('maxQty', negativeFloat, validLotSizeFilter))).toThrow();
    });
    it('WHEN maxQty property is less than minQty property THEN the filter should be invalid', () => {
      const lessThanMinQty = parseFloat(validLotSizeFilter.minQty.toString().slice(0, -1));
      expect(() => lotSizeFilterSchema.parse(assoc('maxQty', lessThanMinQty, validLotSizeFilter))).toThrow();
    });
    it('WHEN maxQty property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp(maxQtyRange);
      expect(lotSizeFilterSchema.parse(assoc('maxQty', float9Digits, validLotSizeFilter))).toHaveProperty(
        'maxQty',
        float8Digits,
      );
    });
  });
  describe('stepSize property', () => {
    it('WHEN stepSize property is missing THEN the filter should be invalid', () => {
      expect(() => lotSizeFilterSchema.parse(omit(['stepSize'], validLotSizeFilter))).toThrow();
    });
    it('WHEN stepSize property equals to zero THEN the filter should be invalid', () => {
      expect(() => lotSizeFilterSchema.parse(assoc('stepSize', 0, validLotSizeFilter))).toThrow();
    });
    it('WHEN stepSize property is a negative number THEN the filter should be invalid', () => {
      expect(() => lotSizeFilterSchema.parse(assoc('stepSize', negativeFloat, validLotSizeFilter))).toThrow();
    });
    it('WHEN stepSize property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const precision9Digits = randomPrecisionStep([9, 9]);
      expect(
        lotSizeFilterSchema.parse(assoc('stepSize', precision9Digits, validLotSizeFilter)),
      ).toHaveProperty('stepSize', precision9Digits * 10);
    });
  });
  describe('WHEN every property is valid', () => {
    it('THEN the filter should be valid', () => {
      expect(lotSizeFilterSchema.parse(validLotSizeFilter)).toEqual(validLotSizeFilter);
    });
  });
});
