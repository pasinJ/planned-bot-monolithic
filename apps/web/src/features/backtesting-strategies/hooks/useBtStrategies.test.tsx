import { waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';
import { is } from 'ramda';

import { HttpClient } from '#infra/httpClient.type';
import { mockBtStrategy } from '#test-utils/features/backtesting-strategies/entities';
import { renderHookWithContexts } from '#test-utils/render';

import { GetBtStrategiesError } from '../repositories/btStrategy.type';
import useBtStrategies from './useBtStrategies';

function renderUseBacktestingStrategies(enabled: boolean, overrides?: { httpClient: HttpClient }) {
  return renderHookWithContexts(
    () => useBtStrategies(enabled),
    ['Infra', 'ServerState'],
    overrides ? { infraContext: { httpClient: overrides.httpClient } } : undefined,
  );
}

describe('WHEN pass enabled = true to the hook', () => {
  it('THEN it should start loading data from server', () => {
    const httpClientSpy = jest.fn();
    const { result } = renderUseBacktestingStrategies(true, { httpClient: { sendRequest: httpClientSpy } });

    expect(result.current.isInitialLoading).toBe(true);
    expect(httpClientSpy).toHaveBeenCalled();
  });
});

describe('WHEN pass enabled = false to the hook', () => {
  it('THEN it should not load any data', () => {
    const httpClientSpy = jest.fn();
    const { result } = renderUseBacktestingStrategies(false, { httpClient: { sendRequest: httpClientSpy } });

    expect(result.current.isInitialLoading).toBe(false);
    expect(httpClientSpy).not.toHaveBeenCalled();
  });
});

describe('WHEN fetching data is successful', () => {
  it('THEN it should return data property equal to fetched data', async () => {
    const strategies = [mockBtStrategy()];
    const { result } = renderUseBacktestingStrategies(true, {
      httpClient: { sendRequest: jest.fn().mockReturnValue(te.right(strategies)) },
    });

    await waitFor(() => expect(result.current.data).toEqual(strategies));
  });
});

describe('WHEN fetching data fails', () => {
  it('THEN it should return error property', async () => {
    const { result } = renderUseBacktestingStrategies(true, {
      httpClient: { sendRequest: jest.fn().mockReturnValue(te.left(new Error('Mock error'))) },
    });

    await waitFor(() => expect(result.current.error).toSatisfy(is(GetBtStrategiesError)));
  });
});
