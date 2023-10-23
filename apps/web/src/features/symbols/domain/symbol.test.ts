import { assoc, dissoc } from 'ramda';

import { randomString } from '#test-utils/faker';
import { mockSymbol } from '#test-utils/features/symbols/domain';

import { symbolSchema } from './symbol';

const validSymbol = mockSymbol();

describe('Symbol schema', () => {
  describe('name property', () => {
    it('WHEN the property is missing THEN the value object should be invalid', () => {
      expect(() => symbolSchema.parse(dissoc('name', validSymbol))).toThrow();
    });
    it('WHEN the property is an empty string THEN the value object should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('name', '', validSymbol))).toThrow();
    });
    it('WHEN the property is a string with only whitespace THEN the value object should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('name', ' ', validSymbol))).toThrow();
    });
  });
  describe('exchange property', () => {
    it('WHEN the property is missing THEN the entity should be invalid', () => {
      expect(() => symbolSchema.parse(dissoc('exchange', validSymbol))).toThrow();
    });
    it('WHEN the property is not in the enum list THEN the entity should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('exchange', randomString(), validSymbol))).toThrow();
    });
  });
  describe('baseAsset property', () => {
    it('WHEN the property is missing THEN the value object should be invalid', () => {
      expect(() => symbolSchema.parse(dissoc('baseAsset', validSymbol))).toThrow();
    });
    it('WHEN the property is an empty string THEN the value object should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('baseAsset', '', validSymbol))).toThrow();
    });
    it('WHEN the property is a string with only whitespace THEN the value object should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('baseAsset', ' ', validSymbol))).toThrow();
    });
    it('WHEN the property is not substring of name property THEN the value object should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('baseAsset', randomString(), validSymbol))).toThrow();
    });
  });
  describe('quoteAsset property', () => {
    it('WHEN the property is missing THEN the value object should be invalid', () => {
      expect(() => symbolSchema.parse(dissoc('quoteAsset', validSymbol))).toThrow();
    });
    it('WHEN the property is an empty string THEN the value object should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('quoteAsset', '', validSymbol))).toThrow();
    });
    it('WHEN the property is a string with only whitespace THEN the value object should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('quoteAsset', ' ', validSymbol))).toThrow();
    });
    it('WHEN the property is not substring of name property THEN the value object should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('quoteAsset', randomString(), validSymbol))).toThrow();
    });
  });
  describe('WHEN there is more than expected properties', () => {
    it('THEN the value object should be invalid', () => {
      expect(() => symbolSchema.parse(assoc('unexpected', randomString(), validSymbol))).toThrow();
    });
  });
  describe('WHEN every perperty is valid', () => {
    it('THEN the value object should be valid', () => {
      expect(symbolSchema.parse(validSymbol)).toEqual(validSymbol);
    });
  });
});
