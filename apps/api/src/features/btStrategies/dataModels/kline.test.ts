import { getTime } from 'date-fns';
import { assoc } from 'ramda';

import { isGeneralError } from '#shared/errors/generalError.js';
import { randomBeforeAndAfterDateInFuture } from '#test-utils/faker/date.js';
import { randomNegativeInt, randomPositiveFloat } from '#test-utils/faker/number.js';
import { mockKline } from '#test-utils/features/btStrategies/models.js';

import { createKlineModel } from './kline.js';

function mockValidData() {
  const kline = mockKline();
  return {
    ...kline,
    openTimestamp: getTime(kline.openTimestamp),
    closeTimestamp: getTime(kline.closeTimestamp),
  };
}

describe('UUT: Create kline model', () => {
  describe('[WHEN] create a kline with all valid perperties', () => {
    it('[THEN] it will return Right of kline model', () => {
      const validData = mockValidData();

      const result = createKlineModel(validData);

      expect(result).toEqualRight({
        ...validData,
        openTimestamp: new Date(validData.openTimestamp),
        closeTimestamp: new Date(validData.closeTimestamp),
      });
    });
  });
  describe('open timestamp property', () => {
    const propertyName = 'openTimestamp';

    it.each([
      { case: 'the property is a float number', value: randomPositiveFloat() },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createKlineModel(data);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('close timestamp property', () => {
    const propertyName = 'closeTimestamp';

    it.each([
      { case: 'the property is a float number', value: randomPositiveFloat() },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createKlineModel(data);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a kline with the property is a date before open timestamp [THEN] it will return Left of error', () => {
      const validData = mockValidData();
      const { before, after } = randomBeforeAndAfterDateInFuture();
      const data = { ...validData, openTimestamp: after.valueOf(), [propertyName]: before.valueOf() };

      const result = createKlineModel(data);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('open price property', () => {
    const propertyName = 'open';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createKlineModel(data);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a kline with the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());

      const result = createKlineModel(data);

      expect(result).toBeRight();
    });
  });
  describe('close price property', () => {
    const propertyName = 'close';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createKlineModel(data);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a kline with the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());

      const result = createKlineModel(data);

      expect(result).toBeRight();
    });
  });
  describe('high price property', () => {
    const propertyName = 'high';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createKlineModel(data);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a kline with the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());

      const result = createKlineModel(data);

      expect(result).toBeRight();
    });
  });
  describe('low price property', () => {
    const propertyName = 'low';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createKlineModel(data);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a kline with the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());

      const result = createKlineModel(data);

      expect(result).toBeRight();
    });
  });
  describe('volume property', () => {
    const propertyName = 'volume';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createKlineModel(data);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a kline with the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());

      const result = createKlineModel(data);

      expect(result).toBeRight();
    });
  });
  describe('quote asset volume property', () => {
    const propertyName = 'quoteAssetVolume';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createKlineModel(data);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a kline with the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());

      const result = createKlineModel(data);

      expect(result).toBeRight();
    });
  });
  describe('taker buy base asset volume property', () => {
    const propertyName = 'takerBuyBaseAssetVolume';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createKlineModel(data);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a kline with the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());

      const result = createKlineModel(data);

      expect(result).toBeRight();
    });
  });
  describe('taker buy quote asset volume property', () => {
    const propertyName = 'takerBuyQuoteAssetVolume';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createKlineModel(data);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a kline with the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());

      const result = createKlineModel(data);

      expect(result).toBeRight();
    });
  });
  describe('number of trades property', () => {
    const propertyName = 'numTrades';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is a float number', value: randomPositiveFloat() },
      { case: 'the property is NaN', value: NaN },
    ])('[WHEN] create a kline with $case [THEN] it will return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());

      const result = createKlineModel(data);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('[WHEN] create a kline with the property is 0 [THEN] it will return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());

      const result = createKlineModel(data);

      expect(result).toBeRight();
    });
  });
});
