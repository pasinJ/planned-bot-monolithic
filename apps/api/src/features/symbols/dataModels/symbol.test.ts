import { faker } from '@faker-js/faker';
import { assoc } from 'ramda';

import { isGeneralError } from '#shared/errors/generalError.js';
import {
  random9DigitsPositiveFloatAndRoundUpValue,
  randomNegativeInt,
  randomPositiveFloat,
  randomPrecisionStep,
} from '#test-utils/faker/number.js';
import { randomString } from '#test-utils/faker/string.js';
import {
  mockLotSizeFilter,
  mockMarketLotSizeFilter,
  mockMinNotionalFilter,
  mockNotionalFilter,
  mockPriceFilter,
  mockSymbol,
} from '#test-utils/features/symbols/models.js';

import { createSymbolModel } from './symbol.js';

const mockValidData = mockSymbol;
const minRange: [number, number] = [1, 10];
const maxRange: [number, number] = [11, 20];

describe('UUT: Create symbol model', () => {
  describe('[WHEN] create a symbol with all valid perperties', () => {
    it('[THEN] it will return Right of symbol model', () => {
      const validData = mockValidData();
      expect(createSymbolModel(validData)).toEqualRight(validData);
    });
  });

  describe('name property', () => {
    const propertyName = 'name';

    it.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createSymbolModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('base asset property', () => {
    const propertyName = 'baseAsset';

    it.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createSymbolModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('base asset precision property', () => {
    const propertyName = 'baseAssetPrecision';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is a float number', value: randomPositiveFloat() },
    ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createSymbolModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());
      const result = createSymbolModel(data);
      expect(result).toBeRight();
    });
  });
  describe('quote asset property', () => {
    const propertyName = 'quoteAsset';

    it.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createSymbolModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('quote asset precision property', () => {
    const propertyName = 'quoteAssetPrecision';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is a float number', value: randomPositiveFloat() },
    ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createSymbolModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());
      const result = createSymbolModel(data);
      expect(result).toBeRight();
    });
  });
  describe('order types property', () => {
    const propertyName = 'orderTypes';

    it('[WHEN] the property is not in the enum list [THEN] it will return Left of error', () => {
      const data = assoc(propertyName, [randomString()], mockValidData());
      const result = createSymbolModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('filters property', () => {
    const propertyName = 'filters';

    it('[WHEN] the property includes duplicated filter type [THEN] it will return Left of error', () => {
      const validData = mockValidData();
      const data = assoc(
        propertyName,
        [...validData.filters, faker.helpers.arrayElement(validData.filters)],
        mockValidData(),
      );
      const result = createSymbolModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] the property is an empty array [THEN] it will return Right', () => {
      const data = assoc(propertyName, [], mockValidData());
      const result = createSymbolModel(data);
      expect(result).toBeRight();
    });

    describe('lot size filter type', () => {
      const mockFilter = mockLotSizeFilter;

      describe('min quantity property', () => {
        const subPropertyName = 'minQty';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is NaN', value: NaN },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] the property is 0 [THEN] it will return Right', () => {
          const filter = assoc(subPropertyName, 0, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toBeRight();
        });
        it('[WHEN] the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
          const { float9Digits, float8Digits } = random9DigitsPositiveFloatAndRoundUpValue(minRange);
          const filter = assoc(subPropertyName, float9Digits, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toHaveProperty(`right.filters[0].${subPropertyName}`, float8Digits);
        });
      });
      describe('max quantity property', () => {
        const subPropertyName = 'maxQty';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is NaN', value: NaN },
          { case: 'the property is 0', value: 0 },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });

        it('[WHEN] maxQty property is less than minQty property [THEN] it will return Left of error', () => {
          const validFilter = mockFilter();
          const lessThanMinQty = parseFloat(validFilter.minQty.toString().slice(0, -3));
          const filter = assoc(subPropertyName, lessThanMinQty, validFilter);
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
          const { float9Digits, float8Digits } = random9DigitsPositiveFloatAndRoundUpValue(maxRange);
          const filter = assoc(subPropertyName, float9Digits, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toHaveProperty(`right.filters[0].${subPropertyName}`, float8Digits);
        });
      });
      describe('step size property', () => {
        const subPropertyName = 'stepSize';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is NaN', value: NaN },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] the property is 0 [THEN] it will return Right', () => {
          const filter = assoc(subPropertyName, 0, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toBeRight();
        });
        it('[WHEN] the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
          const precision9Digits = randomPrecisionStep([9, 9]);
          const filter = assoc(subPropertyName, precision9Digits, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toHaveProperty(`right.filters[0].${subPropertyName}`, precision9Digits * 10);
        });
      });
    });

    describe('market lot size filter type', () => {
      const mockFilter = mockMarketLotSizeFilter;

      describe('min quantity property', () => {
        const subPropertyName = 'minQty';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is NaN', value: NaN },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] the property is 0 [THEN] it will return Right', () => {
          const filter = assoc(subPropertyName, 0, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toBeRight();
        });
        it('[WHEN] the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
          const { float9Digits, float8Digits } = random9DigitsPositiveFloatAndRoundUpValue(minRange);
          const filter = assoc(subPropertyName, float9Digits, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toHaveProperty(`right.filters[0].${subPropertyName}`, float8Digits);
        });
      });
      describe('max quantity property', () => {
        const subPropertyName = 'maxQty';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is NaN', value: NaN },
          { case: 'the property is 0', value: 0 },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });

        it('[WHEN] maxQty property is less than minQty property [THEN] it will return Left of error', () => {
          const validFilter = mockFilter();
          const lessThanMinQty = parseFloat(validFilter.minQty.toString().slice(0, -3));
          const filter = assoc(subPropertyName, lessThanMinQty, validFilter);
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
          const { float9Digits, float8Digits } = random9DigitsPositiveFloatAndRoundUpValue(maxRange);
          const filter = assoc(subPropertyName, float9Digits, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toHaveProperty(`right.filters[0].${subPropertyName}`, float8Digits);
        });
      });
      describe('step size property', () => {
        const subPropertyName = 'stepSize';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is NaN', value: NaN },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] the property is 0 [THEN] it will return Right', () => {
          const filter = assoc(subPropertyName, 0, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toBeRight();
        });
        it('[WHEN] the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
          const precision9Digits = randomPrecisionStep([9, 9]);
          const filter = assoc(subPropertyName, precision9Digits, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toHaveProperty(`right.filters[0].${subPropertyName}`, precision9Digits * 10);
        });
      });
    });

    describe('min notional filter type', () => {
      const mockFilter = mockMinNotionalFilter;

      describe('min notional property', () => {
        const subPropertyName = 'minNotional';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is NaN', value: NaN },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
          const { float9Digits, float8Digits } = random9DigitsPositiveFloatAndRoundUpValue(minRange);
          const filter = assoc(subPropertyName, float9Digits, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toHaveProperty(`right.filters[0].${subPropertyName}`, float8Digits);
        });
      });
      describe('apply to market property', () => {
        const subPropertyName = 'applyToMarket';

        it('[WHEN] applyToMarket property is not a boolean [THEN] it will return Left of error', () => {
          const filter = assoc(subPropertyName, randomString(), mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
      });
      describe('average price minutes property', () => {
        const subPropertyName = 'avgPriceMins';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is a float number', value: randomPositiveFloat() },
          { case: 'the property is NaN', value: NaN },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] the property is 0 [THEN] it will return Right', () => {
          const filter = assoc(subPropertyName, 0, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toBeRight();
        });
      });
    });

    describe('notional filter type', () => {
      const mockFilter = mockNotionalFilter;

      describe('min notional property', () => {
        const subPropertyName = 'minNotional';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is NaN', value: NaN },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
          const { float9Digits, float8Digits } = random9DigitsPositiveFloatAndRoundUpValue(minRange);
          const filter = assoc(subPropertyName, float9Digits, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toHaveProperty(`right.filters[0].${subPropertyName}`, float8Digits);
        });
      });
      describe('apply min to market property', () => {
        const subPropertyName = 'applyMinToMarket';

        it('[WHEN] applyToMarket property is not a boolean [THEN] it will return Left of error', () => {
          const filter = assoc(subPropertyName, randomString(), mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
      });
      describe('max notional property', () => {
        const subPropertyName = 'maxNotional';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is NaN', value: NaN },
          { case: 'the property is 0', value: 0 },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
          const { float9Digits, float8Digits } = random9DigitsPositiveFloatAndRoundUpValue(maxRange);
          const filter = assoc(subPropertyName, float9Digits, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toHaveProperty(`right.filters[0].${subPropertyName}`, float8Digits);
        });
      });
      describe('apply max to market property', () => {
        const subPropertyName = 'applyMaxToMarket';

        it('[WHEN] applyToMarket property is not a boolean [THEN] it will return Left of error', () => {
          const filter = assoc(subPropertyName, randomString(), mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
      });
      describe('average price minutes property', () => {
        const subPropertyName = 'avgPriceMins';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is a float number', value: randomPositiveFloat() },
          { case: 'the property is NaN', value: NaN },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] the property is 0 [THEN] it will return Right', () => {
          const filter = assoc(subPropertyName, 0, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toBeRight();
        });
      });
    });

    describe('price filter type', () => {
      const mockFilter = mockPriceFilter;

      describe('min price property', () => {
        const subPropertyName = 'minPrice';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is NaN', value: NaN },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
          const { float9Digits, float8Digits } = random9DigitsPositiveFloatAndRoundUpValue(minRange);
          const filter = assoc(subPropertyName, float9Digits, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toHaveProperty(`right.filters[0].${subPropertyName}`, float8Digits);
        });
      });
      describe('max price property', () => {
        const subPropertyName = 'maxPrice';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is NaN', value: NaN },
          { case: 'the property is 0', value: 0 },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] maxPrice property is less than minPrice property [THEN] it will return Left of error', () => {
          const validFilter = mockFilter();
          const lessThanMinQty = parseFloat(validFilter.minPrice.toString().slice(0, -3));
          const filter = assoc(subPropertyName, lessThanMinQty, validFilter);
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
          const { float9Digits, float8Digits } = random9DigitsPositiveFloatAndRoundUpValue(maxRange);
          const filter = assoc(subPropertyName, float9Digits, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toHaveProperty(`right.filters[0].${subPropertyName}`, float8Digits);
        });
      });
      describe('tick size property', () => {
        const subPropertyName = 'tickSize';

        it.each([
          { case: 'the property is a negative number', value: randomNegativeInt() },
          { case: 'the property is NaN', value: NaN },
          { case: 'the property is 0', value: 0 },
        ])('[WHEN] $case [THEN] it will return Left of error', ({ value }) => {
          const filter = assoc(subPropertyName, value, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
        });
        it('[WHEN] tickSize property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
          const precision9Digits = randomPrecisionStep([9, 9]);
          const filter = assoc(subPropertyName, precision9Digits, mockFilter());
          const data = assoc(propertyName, [filter], mockValidData());
          const result = createSymbolModel(data);
          expect(result).toHaveProperty(`right.filters[0].${subPropertyName}`, precision9Digits * 10);
        });
      });
    });
  });
});
