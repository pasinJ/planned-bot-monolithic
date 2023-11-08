import { waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';

import { generateArrayOf } from '#test-utils/faker';
import { mockBtStrategy } from '#test-utils/features/btStrategies/btStrategy';
import { renderHookWithContexts } from '#test-utils/render';

import { BtStrategyRepo } from '../btStrategy.repository';
import { createBtStrategyRepoError } from '../btStrategy.repository.error';
import useBtStrategies from './useBtStrategies';

function renderUseBtStrategies(
  autoFetchEnabled: boolean,
  overrides: { btStrategyRepo: Partial<BtStrategyRepo> },
) {
  return renderHookWithContexts(() => useBtStrategies(autoFetchEnabled), ['Infra', 'ServerState'], {
    infraContext: overrides,
  });
}

describe('[GIVEN] enable auto fetching', () => {
  describe('[WHEN] use backtesting strategies hook', () => {
    it('[THEN] it will start fetching data using backtesting strategy repository', () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = { getBtStrategies: jest.fn(te.right([])) };
      const autoFetchEnabled = true;

      renderUseBtStrategies(autoFetchEnabled, { btStrategyRepo });

      expect(btStrategyRepo.getBtStrategies).toHaveBeenCalled();
    });
  });
});

describe('[GIVEN] disable auto fetching', () => {
  describe('[WHEN] use backtesting strategies hook', () => {
    it('[THEN] it will not start fetching data', () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = { getBtStrategies: jest.fn(te.right([])) };
      const autoFetchEnabled = false;

      renderUseBtStrategies(autoFetchEnabled, { btStrategyRepo });

      expect(btStrategyRepo.getBtStrategies).not.toHaveBeenCalled();
    });
  });
});

describe('[GIVEN] backtesting strategy return Right of a list of backtesting strategies', () => {
  describe('[WHEN] use backtesting strategies hook', () => {
    it('[THEN] it will return data property equals to the list of backtesting strategies', async () => {
      const btStrategies = generateArrayOf(mockBtStrategy, 3);
      const btStrategyRepo: Partial<BtStrategyRepo> = { getBtStrategies: jest.fn(te.right(btStrategies)) };
      const autoFetchEnabled = true;

      const { result } = renderUseBtStrategies(autoFetchEnabled, { btStrategyRepo });

      await waitFor(() => expect(result.current.data).toEqual(btStrategies));
    });
  });
});

describe('[GIVEN] backtesting strategy repository return Left of error', () => {
  describe('[WHEN] use backtesting strategies hook', () => {
    it('[THEN] it will return error property equals to the error from repository', async () => {
      const error = createBtStrategyRepoError('GetBtStrategiesFailed', 'Mock');
      const btStrategyRepo: Partial<BtStrategyRepo> = { getBtStrategies: jest.fn(te.left(error)) };
      const autoFetchEnabled = true;

      const { result } = renderUseBtStrategies(autoFetchEnabled, { btStrategyRepo });

      await waitFor(() => expect(result.current.error).toEqual(error));
    });
  });
});
