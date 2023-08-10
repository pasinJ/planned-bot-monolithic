import { allPass, concat, is, not, pipe as pipeR } from 'ramda';

export function mergeConcatArray(x: unknown, y: unknown) {
  const isArrayNotString = allPass([is(Array), pipeR(is(String), not)]) as (val: unknown) => val is unknown[];
  return isArrayNotString(x) && isArrayNotString(y) ? concat(x, y) : x;
}
