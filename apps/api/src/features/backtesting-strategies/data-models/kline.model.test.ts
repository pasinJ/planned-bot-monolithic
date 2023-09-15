import { assoc } from 'ramda';

import { isGeneralError } from '#shared/errors/generalError.js';
import { randomBeforeAndAfterDate, randomNegativeInt, randomPositiveFloat } from '#test-utils/faker.js';
import { mockKline } from '#test-utils/features/btStrategies/models.js';

import { createKlineModel } from './kline.model.js';

const mockValidData = mockKline;

describe('Create kline model', () => {
  describe('WHEN all properties are valid', () => {
    it('THEN it should return Right of kline model', () => {
      const validData = mockValidData();
      expect(createKlineModel(validData)).toEqualRight(validData);
    });
  });
  describe('open timestamp property', () => {
    const propertyName = 'openTimestamp';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is a float number', value: randomPositiveFloat() },
      { case: 'the property is 0', value: 0 },
      { case: 'the property is NaN', value: NaN },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createKlineModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('close timestamp property', () => {
    const propertyName = 'closeTimestamp';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is a float number', value: randomPositiveFloat() },
      { case: 'the property is 0', value: 0 },
      { case: 'the property is NaN', value: NaN },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createKlineModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('WHEN the property is a date before open timestamp THEN it should return Left of error', () => {
      const { before, after } = randomBeforeAndAfterDate();
      const validData = mockValidData();
      const data = { ...validData, openTimestamp: after.valueOf(), [propertyName]: before.valueOf() };
      const result = createKlineModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('open price property', () => {
    const propertyName = 'open';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is 0', value: 0 },
      { case: 'the property is NaN', value: NaN },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createKlineModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('close price property', () => {
    const propertyName = 'close';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is 0', value: 0 },
      { case: 'the property is NaN', value: NaN },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createKlineModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('high price property', () => {
    const propertyName = 'high';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is 0', value: 0 },
      { case: 'the property is NaN', value: NaN },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createKlineModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('low price property', () => {
    const propertyName = 'low';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is 0', value: 0 },
      { case: 'the property is NaN', value: NaN },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createKlineModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
  describe('volume property', () => {
    const propertyName = 'volume';

    it.each([
      { case: 'the property is a negative number', value: randomNegativeInt() },
      { case: 'the property is NaN', value: NaN },
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createKlineModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('WHEN the property is 0 THEN it should return Right', () => {
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
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createKlineModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('WHEN the property is 0 THEN it should return Right', () => {
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
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createKlineModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('WHEN the property is 0 THEN it should return Right', () => {
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
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createKlineModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('WHEN the property is 0 THEN it should return Right', () => {
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
    ])('WHEN $case THEN it should return Left of error', ({ value }) => {
      const data = assoc(propertyName, value, mockValidData());
      const result = createKlineModel(data);
      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
    it('WHEN the property is 0 THEN it should return Right', () => {
      const data = assoc(propertyName, 0, mockValidData());
      const result = createKlineModel(data);
      expect(result).toBeRight();
    });
  });
});
