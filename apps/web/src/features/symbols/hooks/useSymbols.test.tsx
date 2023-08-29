import { waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';
import { is } from 'ramda';

import { HttpClient } from '#infra/httpClient.type';
import { mockSymbol } from '#test-utils/mockValueObject';
import { renderHookWithContexts } from '#test-utils/render';

import { GetSymbolsError } from '../repositories/symbol.type';
import useSymbols from './useSymbols';

function renderUseSymbols(enabled: boolean, overrides?: { httpClient: HttpClient }) {
  return renderHookWithContexts(
    () => useSymbols(enabled),
    ['Infra', 'ServerState'],
    overrides ? { infraContext: { httpClient: overrides.httpClient } } : undefined,
  );
}

describe('WHEN pass enabled = true to the hook', () => {
  it('THEN it should start loading data from server', () => {
    const httpClient = { sendRequest: jest.fn() };
    const { result } = renderUseSymbols(true, { httpClient });

    expect(result.current.isInitialLoading).toBe(true);
    expect(httpClient.sendRequest).toHaveBeenCalled();
  });
});

describe('WHEN pass enabled = false to the hook', () => {
  it('THEN it should not load any data', () => {
    const httpClient = { sendRequest: jest.fn() };
    const { result } = renderUseSymbols(false, { httpClient });

    expect(result.current.isInitialLoading).toBe(false);
    expect(httpClient.sendRequest).not.toHaveBeenCalled();
  });
});

describe('WHEN fetching data is successful', () => {
  it('THEN it should return data property equal to fetched data', async () => {
    const symbols = [mockSymbol()];
    const { result } = renderUseSymbols(true, {
      httpClient: { sendRequest: jest.fn().mockReturnValue(te.right(symbols)) },
    });

    await waitFor(() => expect(result.current.data).toEqual(symbols));
  });
});

describe('WHEN fetching data fails', () => {
  it('THEN it should return error property', async () => {
    const { result } = renderUseSymbols(true, {
      httpClient: { sendRequest: jest.fn().mockReturnValue(te.left(new Error('Mock error'))) },
    });

    await waitFor(() => expect(result.current.error).toSatisfy(is(GetSymbolsError)));
  });
});
