import { faker } from '@faker-js/faker';
import { act, waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';
import { is, values } from 'ramda';

import { exchangeEnum } from '#features/shared/domain/exchange';
import { timeframeEnum } from '#features/shared/domain/timeframe';
import { HttpClient } from '#infra/httpClient.type';
import { anyString } from '#test-utils/faker';
import { mockBacktestingStrategy } from '#test-utils/mockEntity';
import { renderHookWithContexts } from '#test-utils/render';
import { SchemaValidationError } from '#utils/zod';

import { CreateBacktestingStrategyError } from '../repositories/backtestingStrategy.type';
import useCreateBacktestingStrategy from './useCreateBacktestingStrategy';

function renderUseCreateBacktestingStrategy(overrides?: { httpClient: HttpClient }) {
  return renderHookWithContexts(
    () => useCreateBacktestingStrategy(),
    ['Infra', 'ServerState'],
    overrides ? { infraContext: { httpClient: overrides.httpClient } } : undefined,
  );
}

function mockData() {
  return {
    name: anyString(),
    exchange: faker.helpers.arrayElement(values(exchangeEnum)),
    symbol: anyString(),
    currency: anyString(),
    timeframe: faker.helpers.arrayElement(values(timeframeEnum)),
    maxNumKlines: faker.number.int({ min: 1, max: 100 }).toString(),
    initialCapital: faker.number.float({ min: 1, max: 10 }).toString(),
    takerFeeRate: faker.number.float({ min: 1, max: 10 }).toString(),
    makerFeeRate: faker.number.float({ min: 1, max: 10 }).toString(),
    startTimestamp: faker.date.soon(),
    endTimestamp: faker.date.future(),
    body: anyString(),
  };
}

describe('WHEN creating backtesting strategy is successful', () => {
  it('THEN it should return data property equal to backtesting strategy', async () => {
    const strategy = mockBacktestingStrategy();
    const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right(strategy)) };

    const { result } = renderUseCreateBacktestingStrategy({ httpClient });
    act(() => result.current.mutate(mockData()));

    await waitFor(() => expect(result.current.data).toEqual(strategy));
  });
});

describe('WHEN try to create a backtesting strategy with invalid data', () => {
  it('THEN it should return error property', async () => {
    const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right(undefined)) };
    const invalidData = { ...mockData(), initialCapital: anyString() };

    const { result } = renderUseCreateBacktestingStrategy({ httpClient });
    act(() => result.current.mutate(invalidData));

    await waitFor(() => expect(result.current.error).toSatisfy(is(SchemaValidationError)));
  });
});

describe('WHEN creating backtesting strategy fails', () => {
  it('THEN it should return error property', async () => {
    const httpClient = { sendRequest: jest.fn().mockReturnValue(te.left(new Error('Mock errro'))) };

    const { result } = renderUseCreateBacktestingStrategy({ httpClient });
    act(() => result.current.mutate(mockData()));

    await waitFor(() => expect(result.current.error).toSatisfy(is(CreateBacktestingStrategyError)));
  });
});
