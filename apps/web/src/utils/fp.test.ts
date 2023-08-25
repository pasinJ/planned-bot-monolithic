import { faker } from '@faker-js/faker';
import * as te from 'fp-ts/lib/TaskEither';

import { executeTeToPromise } from './fp';

describe('Execute TaskEither to Promise', () => {
  it('WHEN execute TaskEither.right THEN it should return a Promise that resolve with the right value', async () => {
    const value = faker.string.alphanumeric(5);
    const input = te.right(value);

    await expect(executeTeToPromise(input)).resolves.toEqual(value);
  });
  it('WHEN execute TaskEither.left of Error THEN it should throw the left value', async () => {
    const error = new Error('mock');
    const input = te.left(error);

    await expect(() => executeTeToPromise(input)).rejects.toThrow(error);
  });
  it('WHEN execute TaskEither.left of other than Error THEN it should retrun a Promise that reject with the left value', async () => {
    const value = faker.string.alphanumeric(5);
    const input = te.left(value);

    await expect(executeTeToPromise(input)).rejects.toEqual(value);
  });
});
