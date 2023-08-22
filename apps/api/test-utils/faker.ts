import { faker } from '@faker-js/faker';
import { Decimal } from 'decimal.js';

export const anyString = () => faker.string.alphanumeric(5);
export const negativeFloat = () => faker.number.float({ max: -1, min: -10 });
export const anyFloat = () => faker.number.float();
export const negativeInt = () => faker.number.int({ min: -100, max: -1 });
export const nonNegativeInt = () => faker.number.int({ min: 0, max: 100 });
export const randomPositiveFloat = (precision = 8, between: [number, number] = [1, 10]) => {
  const int = faker.number.int({ min: between[0], max: between[1] });
  if (precision === 0) return int;
  else {
    const digits = faker.string.numeric({ length: precision - 1 });
    const lastDigit = faker.string.numeric({ exclude: ['0'] });
    return parseFloat(`${int}.${digits}${lastDigit}`);
  }
};
export const random9DigitsPositiveFloatWithRoundUp = (between: [number, number] = [1, 10]) => {
  const num = randomPositiveFloat(9, between);
  return {
    float9Digits: num,
    float8Digits: new Decimal(num.toString().slice(0, -1)).add(0.00000001).toNumber(),
  };
};
export const randomPrecisionStep = (precisionBetween = [0, 8]) =>
  new Decimal(10)
    .toPower(new Decimal(faker.number.int({ min: precisionBetween[0], max: precisionBetween[1] })).negated())
    .toNumber();

export const invalidDate = new Date('invalid');
export const randomDateBefore = (date: Date) => faker.date.recent({ refDate: date });

export const anyBoolean = () => faker.datatype.boolean();
