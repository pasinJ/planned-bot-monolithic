import { faker } from '@faker-js/faker';
import { Decimal } from 'decimal.js';

export const randomInt = () => faker.number.int();
export const randomPositiveInt = () => faker.number.int({ min: 1, max: 10 });
export const randomNonNegativeInt = () => faker.number.int({ min: 0, max: 10 });
export const randomNegativeInt = () => faker.number.int({ min: -10, max: -1 });

export const randomFloat = () => faker.number.float();
export const randomPositiveFloat = (precision = 8, between: [number, number] = [1, 10]) => {
  return randomFloatWithPrecision(precision, between);
};
export const randomNonNegativeFloat = (precision = 8, between: [number, number] = [0, 10]) => {
  return randomFloatWithPrecision(precision, between);
};
export const randomNegativeFloat = (precision = 8, between: [number, number] = [-10, -1]) => {
  return randomFloatWithPrecision(precision, between);
};

export const randomFloatWithPrecision = (precision: number, between: [number, number]) => {
  const int = faker.number.int({ min: between[0], max: between[1] });
  if (precision === 0) return int;
  else {
    const digits = faker.string.numeric({ length: precision - 1 });
    const lastDigit = faker.string.numeric({ exclude: ['0'] });
    return parseFloat(`${int}.${digits}${lastDigit}`);
  }
};

export const random9DigitsPositiveFloatAndRoundUpValue = (between: [number, number] = [1, 10]) => {
  const num = randomPositiveFloat(9, between);
  return {
    float9Digits: num,
    float8Digits: new Decimal(num.toString().slice(0, -1)).add(0.00000001).toNumber(),
  };
};

export const randomPrecisionStep = (precisionBetween = [0, 8]) => {
  return new Decimal(10)
    .toPower(new Decimal(faker.number.int({ min: precisionBetween[0], max: precisionBetween[1] })).negated())
    .toNumber();
};
