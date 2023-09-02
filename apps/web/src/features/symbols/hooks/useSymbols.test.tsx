import { waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';
import { is } from 'ramda';

import { generateArrayOf } from '#test-utils/faker';
import { mockSymbolRepo } from '#test-utils/features/symbols/repositories';
import { mockSymbol } from '#test-utils/features/symbols/valueObjects';
import { renderHookWithContexts } from '#test-utils/render';

import { GetSymbolsError, SymbolRepo } from '../repositories/symbol.type';
import useSymbols from './useSymbols';

function renderUseSymbols(enabled: boolean, overrides: { symbolRepo: SymbolRepo }) {
  return renderHookWithContexts(() => useSymbols(enabled), ['Infra', 'ServerState'], {
    infraContext: overrides,
  });
}

describe('WHEN pass enabled = true to the hook', () => {
  it('THEN it should start loading data from server', () => {
    const symbolRepo = mockSymbolRepo({ getSymbols: jest.fn(te.right([])) });
    const { result } = renderUseSymbols(true, { symbolRepo });

    expect(result.current.isInitialLoading).toBe(true);
    expect(symbolRepo.getSymbols).toHaveBeenCalled();
  });
});

describe('WHEN pass enabled = false to the hook', () => {
  it('THEN it should not load any data', () => {
    const symbolRepo = mockSymbolRepo({ getSymbols: jest.fn(te.right([])) });
    const { result } = renderUseSymbols(false, { symbolRepo });

    expect(result.current.isInitialLoading).toBe(false);
    expect(symbolRepo.getSymbols).not.toHaveBeenCalled();
  });
});

describe('WHEN fetching data is successful', () => {
  it('THEN it should return data property equal to fetched data', async () => {
    const symbols = generateArrayOf(mockSymbol);
    const symbolRepo = mockSymbolRepo({ getSymbols: jest.fn(te.right(symbols)) });
    const { result } = renderUseSymbols(true, { symbolRepo });

    await waitFor(() => expect(result.current.data).toEqual(symbols));
  });
});

describe('WHEN fetching data fails', () => {
  it('THEN it should return error property', async () => {
    const symbolRepo = mockSymbolRepo({ getSymbols: jest.fn(te.left(new GetSymbolsError())) });
    const { result } = renderUseSymbols(true, { symbolRepo });

    await waitFor(() => expect(result.current.error).toSatisfy(is(GetSymbolsError)));
  });
});
