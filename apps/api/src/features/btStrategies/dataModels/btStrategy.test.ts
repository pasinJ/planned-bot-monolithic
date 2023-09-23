import { assoc, omit } from 'ramda';

import { isGeneralError } from '#shared/errors/generalError.js';
import { randomBeforeAndAfterDateInPast, randomDate, randomDateAfter } from '#test-utils/faker/date.js';
import {
  random9DigitsPositiveFloatAndRoundUpValue,
  randomNegativeInt,
  randomPositiveFloat,
} from '#test-utils/faker/number.js';
import { randomString } from '#test-utils/faker/string.js';
import { mockBtStrategy } from '#test-utils/features/btStrategies/models.js';

import { createBtStrategyModel } from './btStrategy.js';

function mockValidData() {
  const { before, after } = randomBeforeAndAfterDateInPast(currentDate);
  return {
    ...omit(
      ['version', 'createdAt', 'updatedAt'],
      mockBtStrategy({ startTimestamp: before, endTimestamp: after }),
    ),
    id: randomString(),
  };
}

const currentDate = randomDate();

describe('UUT: Create backtesting strategy model', () => {
  describe('[WHEN] create a backtesting strategy with all valid perperties', () => {
    it('[THEN] it will return Right of backtesting strategy model', () => {
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
    ])('[WHEN] create a backtesting strategy with $case [THEN] it will return Left of error', ({ value }) => {
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
    ])('[WHEN] create a backtesting strategy with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

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
    ])('[WHEN] create a backtesting strategy with $case [THEN] it will return Left of error', ({ value }) => {
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
    ])('[WHEN] create a backtesting strategy with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createBtStrategyModel(data, currentDate);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a backtesting strategy with the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());

      const result = createBtStrategyModel(data, currentDate);

      expect(result).toBeRight();
    });
    it('[WHEN] create a backtesting strategy with the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatAndRoundUpValue();
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
    ])('[WHEN] create a backtesting strategy with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createBtStrategyModel(data, currentDate);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a backtesting strategy with the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());

      const result = createBtStrategyModel(data, currentDate);

      expect(result).toBeRight();
    });
    it('[WHEN] create a backtesting strategy with the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatAndRoundUpValue();
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
    ])('[WHEN] create a backtesting strategy with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createBtStrategyModel(data, currentDate);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a backtesting strategy with the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());

      const result = createBtStrategyModel(data, currentDate);

      expect(result).toBeRight();
    });
    it('[WHEN] create a backtesting strategy with the property has more than 8 digits [THEN] it will be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatAndRoundUpValue();
      const data = assoc(propertyName, float9Digits, mockValidData());

      const result = createBtStrategyModel(data, currentDate);

      expect(result).toEqualRight(expect.toContainEntry([propertyName, float8Digits]));
    });
  });
  describe('start timestamp property', () => {
    const propertyName = 'startTimestamp';

    it('[WHEN] create a backtesting strategy with the property is after the current time [THEN] it will return Left of error', () => {
      const validData = mockValidData();
      const after = randomDateAfter(currentDate);
      const data = { ...validData, [propertyName]: after };

      const result = createBtStrategyModel(data, currentDate);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('end timestamp property', () => {
    const propertyName = 'endTimestamp';

    it('[WHEN] create a backtesting strategy with the property is after the current time [THEN] it will return Left of error', () => {
      const validData = mockValidData();
      const after = randomDateAfter(currentDate);
      const data = { ...validData, [propertyName]: after };

      const result = createBtStrategyModel(data, currentDate);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a backtesting strategy with the property equals to start timestamp [THEN] it will return Left of error', () => {
      const validData = mockValidData();
      const data = { ...validData, [propertyName]: validData.startTimestamp };

      const result = createBtStrategyModel(data, currentDate);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a backtesting strategy with the property is a date before start timestamp [THEN] it will return Left of error', () => {
      const validData = mockValidData();
      const { before, after } = randomBeforeAndAfterDateInPast(currentDate);
      const data = { ...validData, startTimestamp: after, [propertyName]: before };

      const result = createBtStrategyModel(data, currentDate);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('body property', () => {
    const propertyName = 'body';

    it.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('[WHEN] create a backtesting strategy with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createBtStrategyModel(data, currentDate);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
});
