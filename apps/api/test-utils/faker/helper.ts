import { faker } from '@faker-js/faker';
import { ReadonlyNonEmptyArray } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';

export const generateArrayOf = <T>(fn: () => T, length = 3) =>
  faker.helpers.multiple(fn, { count: length }) as unknown as ReadonlyNonEmptyArray<T>;
