import { faker } from '@faker-js/faker';
import { act, waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';
import { is } from 'ramda';

import { randomExchangeName, randomTimeframe } from '#test-utils/domain';
import { randomString } from '#test-utils/faker';
import { mockBtStrategyRepo } from '#test-utils/features/backtesting-strategies/repositories';
import { renderHookWithContexts } from '#test-utils/render';
import { SchemaValidationError } from '#utils/zod';

import { AddBtStrategyError, BtStrategyRepo } from '../repositories/btStrategy.type';
import useAddBtStrategy from './useAddBtStrategy';

function renderUseAddBacktestingStrategy(overrides: { btStrategyRepo: Partial<BtStrategyRepo> }) {
  return renderHookWithContexts(() => useAddBtStrategy(), ['Infra', 'ServerState'], {
    infraContext: { btStrategyRepo: mockBtStrategyRepo(overrides.btStrategyRepo) },
  });
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

describe('WHEN adding backtesting strategy is successful', () => {
  it('THEN it should return success status', async () => {
    const btStrategyRepo = { addBtStrategy: jest.fn().mockReturnValue(te.right(undefined)) };
    const { result } = renderUseAddBacktestingStrategy({ btStrategyRepo });

    act(() => result.current.mutate(mockData()));

    await waitFor(() => expect(result.current.isSuccess).toBeTrue());
  });
});

describe('WHEN try to add a backtesting strategy with invalid data', () => {
  it('THEN it should return error property', async () => {
    const btStrategyRepo = { addBtStrategy: jest.fn().mockReturnValue(te.right(undefined)) };
    const { result } = renderUseAddBacktestingStrategy({ btStrategyRepo });

    const invalidData = { ...mockData(), initialCapital: randomString() };
    act(() => result.current.mutate(invalidData));

    await waitFor(() => expect(result.current.error).toSatisfy(is(SchemaValidationError)));
    await waitFor(() => expect(result.current.isError).toBeTrue());
  });
});

describe('WHEN creating backtesting strategy fails', () => {
  it('THEN it should return error property', async () => {
    const btStrategyRepo = { addBtStrategy: jest.fn().mockReturnValue(te.left(new AddBtStrategyError())) };
    const { result } = renderUseAddBacktestingStrategy({ btStrategyRepo });

    act(() => result.current.mutate(mockData()));

    await waitFor(() => expect(result.current.error).toSatisfy(is(AddBtStrategyError)));
    await waitFor(() => expect(result.current.isError).toBeTrue());
  });
});
