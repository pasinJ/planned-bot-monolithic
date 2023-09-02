import { faker } from '@faker-js/faker';
import { Decimal } from 'decimal.js';

export const randomString = () => faker.string.alphanumeric(5);
export const randomNonNegativeInt = () => faker.number.int({ min: 0, max: 10 });
export const randomPositiveInt = () => faker.number.int({ min: 1, max: 10 });
export const randomNegativeInt = () => faker.number.int({ min: -10, max: -1 });
export const nonNegativeFloat = (precision = 8) => randomFloatPrecision(precision, [0, 10]);
export const randomFloatPrecision = (precision = 8, between: [number, number] = [-10, 10]) => {
  const int = faker.number.int({ min: between[0], max: between[1] });
  if (precision === 0) return int;
  else {
    const digits = faker.string.numeric({ length: precision - 1 });
    const lastDigit = faker.string.numeric({ exclude: ['0'] });
    return parseFloat(`${int}.${digits}${lastDigit}`);
  }
};
export const random9DigitsPositiveFloatWithRoundUp = (between: [number, number] = [1, 10]) => {
  const num = randomFloatPrecision(9, between);
  return {
    float9Digits: num,
    float8Digits: new Decimal(num.toString().slice(0, -1)).add(0.00000001).toNumber(),
  };
};

export const invalidDate = new Date('invalid');
export const randomDateBefore = (date: Date) => faker.date.recent({ refDate: date });

export const generateArrayOf = <T>(fn: () => T, length = 3) => faker.helpers.multiple(fn, { count: length });
