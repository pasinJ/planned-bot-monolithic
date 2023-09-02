import { waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';
import { is } from 'ramda';

import { generateArrayOf } from '#test-utils/faker';
import { mockBtStrategy } from '#test-utils/features/backtesting-strategies/entities';
import { mockBtStrategyRepo } from '#test-utils/features/backtesting-strategies/repositories';
import { renderHookWithContexts } from '#test-utils/render';

import { BtStrategyRepo, GetBtStrategiesError } from '../repositories/btStrategy.type';
import useBtStrategies from './useBtStrategies';

function renderUseBacktestingStrategies(
  enabled: boolean,
  overrides: { btStrategyRepo: Partial<BtStrategyRepo> },
) {
  return renderHookWithContexts(() => useBtStrategies(enabled), ['Infra', 'ServerState'], {
    infraContext: { btStrategyRepo: mockBtStrategyRepo(overrides.btStrategyRepo) },
  });
}

describe('WHEN pass enabled = true to the hook', () => {
  it('THEN it should start loading data from server', () => {
    const btStrategyRepo = { getBtStrategies: jest.fn(te.right([])) };
    const { result } = renderUseBacktestingStrategies(true, { btStrategyRepo });

    expect(result.current.isInitialLoading).toBe(true);
    expect(btStrategyRepo.getBtStrategies).toHaveBeenCalled();
  });
});

describe('WHEN pass enabled = false to the hook', () => {
  it('THEN it should not load any data', () => {
    const btStrategyRepo = { getBtStrategies: jest.fn(te.right([])) };
    const { result } = renderUseBacktestingStrategies(false, { btStrategyRepo });

    expect(result.current.isInitialLoading).toBe(false);
    expect(btStrategyRepo.getBtStrategies).not.toHaveBeenCalled();
  });
});

describe('WHEN fetching data is successful', () => {
  it('THEN it should return data property equal to fetched data', async () => {
    const strategies = generateArrayOf(mockBtStrategy);
    const btStrategyRepo = { getBtStrategies: jest.fn(te.right(strategies)) };
    const { result } = renderUseBacktestingStrategies(true, { btStrategyRepo });

    await waitFor(() => expect(result.current.data).toEqual(strategies));
  });
});

describe('WHEN fetching data fails', () => {
  it('THEN it should return error property', async () => {
    const btStrategyRepo = { getBtStrategies: jest.fn(te.left(new GetBtStrategiesError())) };
    const { result } = renderUseBacktestingStrategies(true, { btStrategyRepo });

    await waitFor(() => expect(result.current.error).toSatisfy(is(GetBtStrategiesError)));
  });
});
