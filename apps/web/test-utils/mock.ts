import { faker } from '@faker-js/faker';
import * as e from 'fp-ts/lib/Either';

export function mockPortfolio(init?: { portfolioId?: string; takerFee?: number; makerFee?: number }) {
  return {
    accountId: faker.string.nanoid(),
    portfolioId: init?.portfolioId ?? faker.string.nanoid(),
    takerFee: init?.takerFee ?? faker.number.float({ min: 0, max: 100, precision: 0.00001 }),
    makerFee: init?.makerFee ?? faker.number.float({ min: 0, max: 100, precision: 0.00001 }),
    version: faker.number.int({ min: 0, max: 10 }),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
}

export function mockHttpClient<E, A>(returnValues?: { sendRequest?: e.Either<E, A> }) {
  const defaultReturn = e.right(null);
  const value = returnValues?.sendRequest ?? defaultReturn;

  return {
    httpClient: { sendRequest: jest.fn().mockReturnValue(() => Promise.resolve(value)) },
    returnValues: { sendRequest: value },
  };
}
