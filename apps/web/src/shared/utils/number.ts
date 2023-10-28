import { Decimal } from 'decimal.js';

export function toDigits(val: number, digit: number): number {
  return new Decimal(val).toDecimalPlaces(digit, Decimal.ROUND_HALF_UP).toNumber();
}
export function to2Digits(val: number): number {
  return toDigits(val, 2);
}
export function to4Digits(val: number): number {
  return toDigits(val, 4);
}
export function to8Digits(val: number): number {
  return toDigits(val, 8);
}
