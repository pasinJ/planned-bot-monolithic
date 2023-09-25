import { isEmpty, isNotNil, nth, takeLast } from 'ramda';

import { getPrevItem, isUndefined } from '#shared/utils/general.js';

export type TechnicalAnalysisModule = {
  /** Check if the first array cross over the second array at the last value */
  crossover: (arr1: readonly number[], arr2: readonly number[]) => boolean;
  /** Check if the first array cross under the second array at the last value */
  crossunder: (arr1: readonly number[], arr2: readonly number[]) => boolean;
  /** Check if the `source` array is now falling (continuously decrease) for `period` values long. */
  falling: (source: readonly number[], period: number) => boolean;
  /** Check if the `source` array is now rising (continuously increase) for `period` values long. */
  rising: (source: readonly number[], period: number) => boolean;
  /** Get highest value of the given number of `period` values back. */
  highest: <T extends number>(source: readonly T[], period: number) => T | undefined;
  /** Get lowest value of the given number of `period` values back. */
  lowest: <T extends number>(source: readonly T[], period: number) => T | undefined;
};

export function buildTechnicalAnalysisModule(): TechnicalAnalysisModule {
  return { crossover, crossunder, falling, rising, highest, lowest };
}

function crossover(arr1: readonly number[], arr2: readonly number[]): boolean {
  if (arr1.length < 2 || arr2.length < 2) return false;

  const last1 = nth(-1, arr1);
  const prevLast1 = nth(-2, arr1);
  const last2 = nth(-1, arr2);
  const prevLast2 = nth(-2, arr2);

  if (isUndefined(last1) || isUndefined(last2) || isUndefined(prevLast1) || isUndefined(prevLast2)) {
    return false;
  } else if (last1 > last2 && prevLast1 <= prevLast2) {
    return true;
  } else {
    return false;
  }
}

function crossunder(arr1: readonly number[], arr2: readonly number[]): boolean {
  if (arr1.length < 2 || arr2.length < 2) return false;

  const last1 = nth(-1, arr1);
  const prevLast1 = nth(-2, arr1);
  const last2 = nth(-1, arr2);
  const prevLast2 = nth(-2, arr2);

  if (isUndefined(last1) || isUndefined(last2) || isUndefined(prevLast1) || isUndefined(prevLast2)) {
    return false;
  } else if (last1 < last2 && prevLast1 >= prevLast2) {
    return true;
  } else {
    return false;
  }
}

function falling(source: readonly number[], period: number): boolean {
  const lastPeriod = takeLast(period, source).filter((n) => !isNaN(n));

  if (lastPeriod.length < period) return false;

  return lastPeriod.reduce((result, current, index) => {
    if (!result) return result;
    else if (index === 0) return true;

    const prevValue = getPrevItem(lastPeriod, index);
    if (isNotNil(prevValue) && prevValue > current) return true;
    else return false;
  }, true);
}

function rising(source: readonly number[], period: number): boolean {
  const lastPeriod = takeLast(period, source).filter((n) => !isNaN(n));

  if (lastPeriod.length < period) return false;

  return lastPeriod.reduce((result, current, index) => {
    if (!result) return result;
    else if (index === 0) return true;

    const prevValue = getPrevItem(lastPeriod, index);
    if (isNotNil(prevValue) && prevValue < current) return true;
    else return false;
  }, true);
}

function highest<T extends number>(source: readonly T[], period: number): T | undefined {
  if (isEmpty(source)) return undefined;

  return takeLast(period, source).reduce(
    (max, current) => (current > max ? current : max),
    Number.MIN_VALUE,
  ) as T;
}

function lowest<T extends number>(source: readonly T[], period: number): T | undefined {
  if (isEmpty(source)) return undefined;

  return takeLast(period, source).reduce(
    (min, current) => (current < min ? current : min),
    Number.MAX_VALUE,
  ) as T;
}
