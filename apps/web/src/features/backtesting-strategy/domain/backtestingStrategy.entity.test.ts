import { assoc, dissoc } from 'ramda';

import {
  anyString,
  invalidDate,
  negativeInt,
  nonNegativeFloat,
  random9DigitsPositiveFloatWithRoundUp,
  randomDateBefore,
} from '#test-utils/faker';
import { mockBacktestingStrategy } from '#test-utils/mockEntity';

import { backtestingStrategySchema } from './backtestingStrategy.entity';

const validBacktestingStrategy = mockBacktestingStrategy();

describe('Backtesting strategy schema', () => {
  describe('id property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(dissoc('id', validBacktestingStrategy))).toThrow();
    });
    it('WHEN the property is an empty string THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(assoc('id', '', validBacktestingStrategy))).toThrow();
    });
    it('WHEN the property is a string with only whitespace THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(assoc('id', ' ', validBacktestingStrategy))).toThrow();
    });
  });
  describe('name property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(dissoc('name', validBacktestingStrategy))).toThrow();
    });
    it('WHEN the property is an empty string THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(assoc('name', '', validBacktestingStrategy))).toThrow();
    });
    it('WHEN the property is a string with only whitespace THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(assoc('name', ' ', validBacktestingStrategy))).toThrow();
    });
  });
  describe('exchange property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(dissoc('exchange', validBacktestingStrategy))).toThrow();
    });
    it('WHEN the property is not in the enum list THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('exchange', anyString(), validBacktestingStrategy)),
      ).toThrow();
    });
  });
  describe('currency property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(dissoc('currency', validBacktestingStrategy))).toThrow();
    });
    it('WHEN the property is an empty string THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('currency', '', validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is a string with only whitespace THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('currency', ' ', validBacktestingStrategy)),
      ).toThrow();
    });
  });
  describe('takerFeeRate property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(dissoc('takerFeeRate', validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is a negative number THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('takerFeeRate', negativeInt(), validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is more than 100 THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('takerFeeRate', 101, validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is NaN THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('takerFeeRate', NaN, validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is zero THEN the entity should be valid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('takerFeeRate', 0, validBacktestingStrategy)),
      ).not.toThrow();
    });
    it('WHEN the property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp();
      expect(
        backtestingStrategySchema.parse(assoc('takerFeeRate', float9Digits, validBacktestingStrategy)),
      ).toHaveProperty('takerFeeRate', float8Digits);
    });
  });
  describe('makerFeeRate property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(dissoc('makerFeeRate', validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is a negative number THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('makerFeeRate', negativeInt(), validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is more than 100 THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('makerFeeRate', 101, validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is NaN THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('makerFeeRate', NaN, validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is zero THEN the entity should be valid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('makerFeeRate', 0, validBacktestingStrategy)),
      ).not.toThrow();
    });
    it('WHEN the property has more than 8 digits THEN it should be rounded up to the closest number with 8 digits', () => {
      const { float9Digits, float8Digits } = random9DigitsPositiveFloatWithRoundUp();
      expect(
        backtestingStrategySchema.parse(assoc('makerFeeRate', float9Digits, validBacktestingStrategy)),
      ).toHaveProperty('makerFeeRate', float8Digits);
    });
  });
  describe('maxNumLastKline property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(dissoc('maxNumLastKline', validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is a negative number THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('maxNumLastKline', negativeInt(), validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is NaN THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('maxNumLastKline', NaN, validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is zero THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('maxNumLastKline', 0, validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is a float number THEN it should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(
          assoc('maxNumLastKline', nonNegativeFloat(), validBacktestingStrategy),
        ),
      ).toThrow();
    });
  });
  describe('body property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(dissoc('body', validBacktestingStrategy))).toThrow();
    });
    it('WHEN the property is an empty string THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(assoc('body', '', validBacktestingStrategy))).toThrow();
    });
    it('WHEN the property is a string with only whitespace THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(assoc('body', ' ', validBacktestingStrategy))).toThrow();
    });
  });
  describe('version property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(dissoc('version', validBacktestingStrategy))).toThrow();
    });
    it('WHEN the property is a negative number THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('version', negativeInt(), validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is NaN THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('version', NaN, validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is a float number THEN it should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('version', nonNegativeFloat(), validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is zero THEN the entity should be valid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('version', 0, validBacktestingStrategy)),
      ).not.toThrow();
    });
  });
  describe('createdAt property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(dissoc('createdAt', validBacktestingStrategy))).toThrow();
    });
    it('WHEN the property is an invalid date THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('createdAt', invalidDate, validBacktestingStrategy)),
      ).toThrow();
    });
  });
  describe('updatedAt property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => backtestingStrategySchema.parse(dissoc('updatedAt', validBacktestingStrategy))).toThrow();
    });
    it('WHEN the property is an invalid date THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('updatedAt', invalidDate, validBacktestingStrategy)),
      ).toThrow();
    });
    it('WHEN the property is a date before createdAt THEN the entity should be invalid', () => {
      const dateBefore = randomDateBefore(validBacktestingStrategy.createdAt);
      expect(() =>
        backtestingStrategySchema.parse(assoc('updatedAt', dateBefore, validBacktestingStrategy)),
      ).toThrow();
    });
  });
  describe('WHEN there is more than expected properties', () => {
    it('THEN the entity should be invalid', () => {
      expect(() =>
        backtestingStrategySchema.parse(assoc('unexpected', anyString(), validBacktestingStrategy)),
      ).toThrow();
    });
  });
  describe('WHEN every perperty is valid', () => {
    it('THEN the entity should be valid', () => {
      expect(backtestingStrategySchema.parse(validBacktestingStrategy)).toEqual(validBacktestingStrategy);
    });
  });
});
