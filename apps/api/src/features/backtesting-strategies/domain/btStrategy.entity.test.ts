import { faker } from '@faker-js/faker';
import { assoc, dissoc, is, omit } from 'ramda';

import {
  anyString,
  invalidDate,
  random9DigitsPositiveFloatWithRoundUp,
  randomDateBefore,
  randomNegativeInt,
  randomNonNegativeFloat,
  randomPositiveFloat,
} from '#test-utils/faker.js';
import { mockBtStrategy } from '#test-utils/features/btStrategies/entities.js';

import { CreateNewBtStrategyError, btStrategySchema, createNewBtStrategy } from './btStrategy.entity.js';

const validBtStrategy = mockBtStrategy();

describe('Backtesting strategy entity', () => {
  describe('id property', () => {
    it('WHEN id property is missing THEN the symbol should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('id', validBtStrategy))).toThrow();
    });
    it('WHEN id property is an empty string THEN the symbol should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('id', '', validBtStrategy))).toThrow();
    });
    it('WHEN id property is a string with only whitespace THEN the symbol should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('id', ' ', validBtStrategy))).toThrow();
    });
  });
  describe('WHEN there is more than expected properties', () => {
    it('THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('unexpected', anyString(), validBtStrategy))).toThrow();
    });
  });
  describe('name property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('name', validBtStrategy))).toThrow();
    });
    it('WHEN the property is an empty string THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('name', '', validBtStrategy))).toThrow();
    });
    it('WHEN the property is a string with only whitespace THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('name', ' ', validBtStrategy))).toThrow();
    });
  });
  describe('exchange property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('exchange', validBtStrategy))).toThrow();
    });
    it('WHEN the property is not in the enum list THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('exchange', anyString(), validBtStrategy))).toThrow();
    });
  });
  describe('symbol property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('symbol', validBtStrategy))).toThrow();
    });
    it('WHEN the property is an empty string THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('symbol', '', validBtStrategy))).toThrow();
    });
    it('WHEN the property is a string with only whitespace THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('symbol', ' ', validBtStrategy))).toThrow();
    });
  });
  describe('currency property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('currency', validBtStrategy))).toThrow();
    });
    it('WHEN the property is an empty string THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('currency', '', validBtStrategy))).toThrow();
    });
    it('WHEN the property is a string with only whitespace THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('currency', ' ', validBtStrategy))).toThrow();
    });
  });
  describe('timeframe property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('timeframe', validBtStrategy))).toThrow();
    });
    it('WHEN the property is not in the enum list THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('timeframe', anyString(), validBtStrategy))).toThrow();
    });
  });
  describe('maxNumKlines property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('maxNumKlines', validBtStrategy))).toThrow();
    });
    it('WHEN the property is a negative number THEN the entity should be invalid', () => {
      expect(() =>
        btStrategySchema.parse(assoc('maxNumKlines', randomNegativeInt(), validBtStrategy)),
      ).toThrow();
    });
    it('WHEN the property is NaN THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('maxNumKlines', NaN, validBtStrategy))).toThrow();
    });
    it('WHEN the property is zero THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('maxNumKlines', 0, validBtStrategy))).toThrow();
    });
    it('WHEN the property is a float number THEN it should be invalid', () => {
      expect(() =>
        btStrategySchema.parse(assoc('maxNumKlines', randomPositiveFloat(), validBtStrategy)),
      ).toThrow();
    });
  });
  describe('initial capital property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('initialCapital', validBtStrategy))).toThrow();
    });
    it('WHEN the property is a negative number THEN the entity should be invalid', () => {
      expect(() =>
        btStrategySchema.parse(assoc('initialCapital', randomNegativeInt(), validBtStrategy)),
      ).toThrow();
    });
    it('WHEN the property is NaN THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('initialCapital', NaN, validBtStrategy))).toThrow();
    });
    it('WHEN the property is zero THEN the entity should be valid', () => {
      expect(() => btStrategySchema.parse(assoc('initialCapital', 0, validBtStrategy))).not.toThrow();
    });
    it('WHEN the property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp();
      expect(btStrategySchema.parse(assoc('initialCapital', float9Digits, validBtStrategy))).toHaveProperty(
        'initialCapital',
        float8Digits,
      );
    });
  });
  describe('takerFeeRate property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('takerFeeRate', validBtStrategy))).toThrow();
    });
    it('WHEN the property is a negative number THEN the entity should be invalid', () => {
      expect(() =>
        btStrategySchema.parse(assoc('takerFeeRate', randomNegativeInt(), validBtStrategy)),
      ).toThrow();
    });
    it('WHEN the property is more than 100 THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('takerFeeRate', 101, validBtStrategy))).toThrow();
    });
    it('WHEN the property is NaN THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('takerFeeRate', NaN, validBtStrategy))).toThrow();
    });
    it('WHEN the property is zero THEN the entity should be valid', () => {
      expect(() => btStrategySchema.parse(assoc('takerFeeRate', 0, validBtStrategy))).not.toThrow();
    });
    it('WHEN the property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp();
      expect(btStrategySchema.parse(assoc('takerFeeRate', float9Digits, validBtStrategy))).toHaveProperty(
        'takerFeeRate',
        float8Digits,
      );
    });
  });
  describe('makerFeeRate property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('makerFeeRate', validBtStrategy))).toThrow();
    });
    it('WHEN the property is a negative number THEN the entity should be invalid', () => {
      expect(() =>
        btStrategySchema.parse(assoc('makerFeeRate', randomNegativeInt(), validBtStrategy)),
      ).toThrow();
    });
    it('WHEN the property is more than 100 THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('makerFeeRate', 101, validBtStrategy))).toThrow();
    });
    it('WHEN the property is NaN THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('makerFeeRate', NaN, validBtStrategy))).toThrow();
    });
    it('WHEN the property is zero THEN the entity should be valid', () => {
      expect(() => btStrategySchema.parse(assoc('makerFeeRate', 0, validBtStrategy))).not.toThrow();
    });
    it('WHEN the property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp();
      expect(btStrategySchema.parse(assoc('makerFeeRate', float9Digits, validBtStrategy))).toHaveProperty(
        'makerFeeRate',
        float8Digits,
      );
    });
  });
  describe('start timestamp property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('startTimestamp', validBtStrategy))).toThrow();
    });
    it('WHEN the property is an invalid date THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('startTimestamp', invalidDate, validBtStrategy))).toThrow();
    });
  });
  describe('end timestamp property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('endTimestamp', validBtStrategy))).toThrow();
    });
    it('WHEN the property is an invalid date THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('endTimestamp', invalidDate, validBtStrategy))).toThrow();
    });
    it('WHEN the property is a date before start timestamp THEN the entity should be invalid', () => {
      const dateBefore = randomDateBefore(validBtStrategy.startTimestamp);
      expect(() => btStrategySchema.parse(assoc('endTimestamp', dateBefore, validBtStrategy))).toThrow();
    });
  });
  describe('body property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('body', validBtStrategy))).toThrow();
    });
    it('WHEN the property is an empty string THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('body', '', validBtStrategy))).toThrow();
    });
    it('WHEN the property is a string with only whitespace THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('body', ' ', validBtStrategy))).toThrow();
    });
  });
  describe('version property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('version', validBtStrategy))).toThrow();
    });
    it('WHEN the property is a negative number THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('version', randomNegativeInt(), validBtStrategy))).toThrow();
    });
    it('WHEN the property is NaN THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('version', NaN, validBtStrategy))).toThrow();
    });
    it('WHEN the property is a float number THEN it should be invalid', () => {
      expect(() =>
        btStrategySchema.parse(assoc('version', randomNonNegativeFloat(), validBtStrategy)),
      ).toThrow();
    });
    it('WHEN the property is zero THEN the entity should be valid', () => {
      expect(() => btStrategySchema.parse(assoc('version', 0, validBtStrategy))).not.toThrow();
    });
  });
  describe('createdAt property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('createdAt', validBtStrategy))).toThrow();
    });
    it('WHEN the property is an invalid date THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('createdAt', invalidDate, validBtStrategy))).toThrow();
    });
  });
  describe('updatedAt property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(dissoc('updatedAt', validBtStrategy))).toThrow();
    });
    it('WHEN the property is an invalid date THEN the entity should be invalid', () => {
      expect(() => btStrategySchema.parse(assoc('updatedAt', invalidDate, validBtStrategy))).toThrow();
    });
    it('WHEN the property is a date before createdAt THEN the entity should be invalid', () => {
      const dateBefore = randomDateBefore(validBtStrategy.createdAt);
      expect(() => btStrategySchema.parse(assoc('updatedAt', dateBefore, validBtStrategy))).toThrow();
    });
  });
  describe('WHEN every perperty is valid', () => {
    it('THEN the entity should be valid', () => {
      expect(btStrategySchema.parse(validBtStrategy)).toEqual(validBtStrategy);
    });
  });
});

describe('Create new backtesting strategy entity', () => {
  describe('WHEN successfully create new backtesting strategy entity', () => {
    it('THEN it should return Right of a backtesting strategy entity', () => {
      const data = omit(['version', 'createdAt', 'updatedAt'], mockBtStrategy());
      const currentDate = faker.date.soon();
      const entity = createNewBtStrategy(data, currentDate);

      expect(entity).toEqualRight({ ...data, version: 0, createdAt: currentDate, updatedAt: currentDate });
    });
  });
  describe('WHEN try to create new backtesting strategy entity with invalid data', () => {
    it('THEN it should return Left of error', () => {
      const data = omit(['version', 'createdAt', 'updatedAt'], mockBtStrategy());
      const currentDate = new Date('invalid');
      const entity = createNewBtStrategy(data, currentDate);

      expect(entity).toEqualLeft(expect.toSatisfy(is(CreateNewBtStrategyError)));
    });
  });
});
