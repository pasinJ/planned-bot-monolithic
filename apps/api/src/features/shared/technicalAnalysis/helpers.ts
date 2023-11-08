import { is, isEmpty, isNotNil, nth, takeLast } from 'ramda';

import { getPrevItem, isUndefined } from '#shared/utils/general.js';

export function crossover(values: readonly number[], crossoverWith: number | readonly number[]): boolean {
  if (values.length < 2) return false;

  const last1 = nth(-1, values);
  const prevLast1 = nth(-2, values);

  if (isUndefined(last1) || isUndefined(prevLast1)) return false;
  else if (is(Number, crossoverWith)) return last1 > crossoverWith && prevLast1 <= crossoverWith;

  const last2 = nth(-1, crossoverWith);
  const prevLast2 = nth(-2, crossoverWith);

  if (isUndefined(last2) || isUndefined(prevLast2)) return false;
  else return last1 > last2 && prevLast1 <= prevLast2;
}

export function crossunder(values: readonly number[], crossunderWith: number | readonly number[]): boolean {
  if (values.length < 2) return false;

  const last1 = nth(-1, values);
  const prevLast1 = nth(-2, values);

  if (isUndefined(last1) || isUndefined(prevLast1)) return false;
  else if (is(Number, crossunderWith)) return last1 < crossunderWith && prevLast1 >= crossunderWith;

  const last2 = nth(-1, crossunderWith);
  const prevLast2 = nth(-2, crossunderWith);

  if (isUndefined(last2) || isUndefined(prevLast2)) return false;
  else return last1 < last2 && prevLast1 >= prevLast2;
}

export function falling(source: readonly number[], period: number): boolean {
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

export function rising(source: readonly number[], period: number): boolean {
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

export function highest<T extends number>(source: readonly T[], period: number): T | undefined {
  if (isEmpty(source)) return undefined;

  return takeLast(period, source).reduce(
    (max, current) => (current > max ? current : max),
    Number.MIN_SAFE_INTEGER,
  ) as T;
}

export function lowest<T extends number>(source: readonly T[], period: number): T | undefined {
  if (isEmpty(source)) return undefined;

  return takeLast(period, source).reduce(
    (min, current) => (current < min ? current : min),
    Number.MAX_SAFE_INTEGER,
  ) as T;
}
