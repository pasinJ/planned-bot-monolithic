import { faker } from '@faker-js/faker';
import { act, waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';
import { is } from 'ramda';

import { HttpClient } from '#infra/httpClient.type';
import { randomExchangeName, randomTimeframe } from '#test-utils/domain';
import { randomString } from '#test-utils/faker';
import { mockBtStrategy } from '#test-utils/features/backtesting-strategies/entities';
import { renderHookWithContexts } from '#test-utils/render';
import { SchemaValidationError } from '#utils/zod';

import { AddBtStrategyError } from '../repositories/btStrategy.type';
import useAddBtStrategy from './useAddBtStrategy';

function renderUseAddBacktestingStrategy(overrides?: { httpClient: HttpClient }) {
  return renderHookWithContexts(
    () => useAddBtStrategy(),
    ['Infra', 'ServerState'],
    overrides ? { infraContext: { httpClient: overrides.httpClient } } : undefined,
  );
}

function mockData() {
  return {
    name: randomString(),
    exchange: randomExchangeName(),
    symbol: randomString(),
    currency: randomString(),
    timeframe: randomTimeframe(),
    maxNumKlines: faker.number.int({ min: 1, max: 100 }).toString(),
    initialCapital: faker.number.float({ min: 1, max: 10 }).toString(),
    takerFeeRate: faker.number.float({ min: 1, max: 10 }).toString(),
    makerFeeRate: faker.number.float({ min: 1, max: 10 }).toString(),
    startTimestamp: faker.date.soon(),
    endTimestamp: faker.date.future(),
    body: randomString(),
  };
}

describe('WHEN creating backtesting strategy is successful', () => {
  it('THEN it should return data property equal to backtesting strategy', async () => {
    const strategy = mockBtStrategy();
    const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right(strategy)) };

    const { result } = renderUseAddBacktestingStrategy({ httpClient });
    act(() => result.current.mutate(mockData()));

    await waitFor(() => expect(result.current.data).toEqual(strategy));
  });
});

describe('WHEN try to add a backtesting strategy with invalid data', () => {
  it('THEN it should return error property', async () => {
    const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right(undefined)) };
    const invalidData = { ...mockData(), initialCapital: randomString() };

    const { result } = renderUseAddBacktestingStrategy({ httpClient });
    act(() => result.current.mutate(invalidData));

    await waitFor(() => expect(result.current.error).toSatisfy(is(SchemaValidationError)));
  });
});

describe('WHEN creating backtesting strategy fails', () => {
  it('THEN it should return error property', async () => {
    const httpClient = { sendRequest: jest.fn().mockReturnValue(te.left(new Error('Mock errro'))) };

    const { result } = renderUseAddBacktestingStrategy({ httpClient });
    act(() => result.current.mutate(mockData()));

    await waitFor(() => expect(result.current.error).toSatisfy(is(AddBtStrategyError)));
  });
});
