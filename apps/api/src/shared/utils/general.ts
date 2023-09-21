import { allPass, concat, is, not, pipe as pipeR } from 'ramda';

export function mergeConcatArray(x: unknown, y: unknown) {
  const isArrayNotString = allPass([is(Array), pipeR(is(String), not)]) as (val: unknown) => val is unknown[];
  return isArrayNotString(x) && isArrayNotString(y) ? concat(x, y) : x;
}

export function getPrevItem<T>(list: T[], currentIndex: number, length = 1): T | undefined {
  const prevIndex = currentIndex - length;

  if (prevIndex < 0) return undefined;
  else return list.at(prevIndex);
}
