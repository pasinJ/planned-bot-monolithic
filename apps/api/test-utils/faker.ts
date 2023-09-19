import { faker } from '@faker-js/faker';
import { Decimal } from 'decimal.js';

export const randomString = () => faker.string.alphanumeric(5);
export const randomNegativeFloat = () => faker.number.float({ max: -1, min: -10 });
export const randomAnyFloat = () => faker.number.float();
export const randomNegativeInt = () => faker.number.int({ min: -10, max: -1 });
export const randomPositiveInt = () => faker.number.int({ min: 1, max: 10 });
export const randomNonNegativeInt = () => faker.number.int({ min: 0, max: 10 });
export const randomNonNegativeFloat = (precision = 8, between: [number, number] = [0, 10]) =>
  randomPrecisionFloat(precision, between);
export const randomPositiveFloat = (precision = 8, between: [number, number] = [1, 10]) =>
  randomPrecisionFloat(precision, between);
export const randomPrecisionFloat = (precision: number, between: [number, number]) => {
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
export const randomAnyDate = () => faker.date.anytime();
export const randomDateBefore = (date: Date) => faker.date.past({ refDate: date });
export const randomBeforeAndAfterDate = (refDate?: Date) => {
  const before = faker.date.soon({ refDate });
  const after = faker.date.future({ refDate: before });

  return { before, after };
};
export const randomBeforeAndAfterDateInPast = (refDate?: Date) => {
  const before = faker.date.past({ refDate });
  const after = faker.date.soon({ refDate: before });

  return { before, after };
};

export const randomBoolean = () => faker.datatype.boolean();

export const generateArrayOf = <T>(fn: () => T, length = 3) => faker.helpers.multiple(fn, { count: length });
