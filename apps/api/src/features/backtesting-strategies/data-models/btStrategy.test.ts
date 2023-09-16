import { assoc, omit } from 'ramda';

import { ExchangeName } from '#features/shared/domain/exchangeName.js';
import { SymbolName } from '#features/shared/domain/symbolName.js';
import { isGeneralError } from '#shared/errors/generalError.js';
import {
  invalidDate,
  random9DigitsPositiveFloatWithRoundUp,
  randomAnyDate,
  randomBeforeAndAfterDate,
  randomNegativeInt,
  randomPositiveFloat,
  randomString,
} from '#test-utils/faker.js';
import { mockBtStrategy } from '#test-utils/features/btStrategies/models.js';

import { createBtStrategyModel } from './btStrategy.js';

function mockValidData() {
  return { ...omit(['version', 'createdAt', 'updatedAt'], mockBtStrategy()), id: randomString() };
}

const currentDate = randomAnyDate();

describe('Create backtesting strategy model', () => {
  describe('WHEN all perperties is valid', () => {
    it('THEN it should return Right of backtesting strategy', () => {
      const validData = mockValidData();
      expect(createBtStrategyModel(validData, currentDate)).toEqualRight({
        ...validData,
        version: 0,
        createdAt: currentDate,
        updatedAt: currentDate,
      });
    });
  });
  describe('id property', () => {
    const propertyName = 'id';

    it.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('name property', () => {
    const propertyName = 'name';

    it.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('exchange property', () => {
    const propertyName = 'exchange';

    it('WHEN the property is not in the enum list THEN it should return Left of error', () => {
      const data = assoc(propertyName, randomString() as ExchangeName, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('symbol property', () => {
    const propertyName = 'symbol';

    it.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value as SymbolName, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('currency property', () => {
    const propertyName = 'currency';

    it.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('timeframe property', () => {
    const propertyName = 'timeframe';

    it('WHEN the property is not in the enum list THEN it should return Left of error', () => {
      const data = assoc(propertyName, randomString(), mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('maximum number of klines property', () => {
    const propertyName = 'maxNumKlines';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is NaN', value: NaN },
      { case: 'the property is 0', value: 0 },
      { case: 'the property is a float number', value: randomPositiveFloat() },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('initial capital property', () => {
    const propertyName = 'initialCapital';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is NaN', value: NaN },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('WHEN the property is 0 THEN it should return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toBeRight();
    });
    it('WHEN the property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp();
      const data = assoc(propertyName, float9Digits, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualRight(expect.toContainEntry([propertyName, float8Digits]));
    });
  });
  describe('taker fee rate property', () => {
    const propertyName = 'takerFeeRate';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is NaN', value: NaN },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('WHEN the property is 0 THEN it should return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toBeRight();
    });
    it('WHEN the property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp();
      const data = assoc(propertyName, float9Digits, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualRight(expect.toContainEntry([propertyName, float8Digits]));
    });
  });
  describe('maker fee rate property', () => {
    const propertyName = 'makerFeeRate';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is NaN', value: NaN },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('WHEN the property is 0 THEN it should return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toBeRight();
    });
    it('WHEN the property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp();
      const data = assoc(propertyName, float9Digits, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualRight(expect.toContainEntry([propertyName, float8Digits]));
    });
  });
  describe('start timestamp property', () => {
    const propertyName = 'startTimestamp';

    it('WHEN the property is an invalid date THEN it should return Left of error', () => {
      const data = assoc(propertyName, invalidDate, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('end timestamp property', () => {
    const propertyName = 'endTimestamp';

    it('WHEN the property is an invalid date THEN it should return Left of error', () => {
      const data = assoc(propertyName, invalidDate, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('WHEN the property is a date before start timestamp THEN it should return Left of error', () => {
      const { before, after } = randomBeforeAndAfterDate();
      const validData = mockValidData();
      const data = { ...validData, startTimestamp: after, [propertyName]: before };
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('language property', () => {
    const propertyName = 'language';

    it('WHEN the property is not in the enum list THEN it should return Left of error', () => {
      const data = assoc(propertyName, randomString(), mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('body property', () => {
    const propertyName = 'body';

    it.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createBtStrategyModel(data, currentDate);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
});
