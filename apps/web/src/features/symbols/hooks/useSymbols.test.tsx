import { waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';

import { generateArrayOf } from '#test-utils/faker';
import { mockSymbol } from '#test-utils/features/symbols/domain';
import { renderHookWithContexts } from '#test-utils/render';

import { SymbolRepo } from '../symbol.repository';
import { createSymbolRepoError } from '../symbol.repository.error';
import useSymbols from './useSymbols';

function renderUseSymbols(autoFetchEnabled: boolean, overrides: { symbolRepo: SymbolRepo }) {
  return renderHookWithContexts(() => useSymbols(autoFetchEnabled), ['Infra', 'ServerState'], {
    infraContext: overrides,
  });
}

describe('[GIVEN] enable auto fetching', () => {
  describe('[WHEN] use symbols hook', () => {
    it('[THEN] it will start fetching data using symbol repository', () => {
      const symbolRepo: SymbolRepo = { getSymbols: jest.fn().mockReturnValue(te.right([])) };
      const autoFetchEnabled = true;

      renderUseSymbols(autoFetchEnabled, { symbolRepo });

      expect(symbolRepo.getSymbols).toHaveBeenCalled();
    });
  });
});

describe('[GIVEN] disable auto fetching', () => {
  describe('[WHEN] use symbols hook', () => {
    it('[THEN] it will not fetch data', () => {
      const symbolRepo: SymbolRepo = { getSymbols: jest.fn().mockReturnValue(te.right([])) };
      const autoFetchEnabled = false;

      renderUseSymbols(autoFetchEnabled, { symbolRepo });

      expect(symbolRepo.getSymbols).not.toHaveBeenCalled();
    });
  });
});

describe('[GIVEN] symbol repository return Right of a list of symbols', () => {
  describe('[WHEN] use symbols hook', () => {
    it('[THEN] it will return data property equals to the list of symbols', async () => {
      const symbols = generateArrayOf(mockSymbol, 3);
      const symbolRepo: SymbolRepo = { getSymbols: jest.fn(te.right(symbols)) };
      const autoFetchEnabled = true;

      const { result } = renderUseSymbols(autoFetchEnabled, { symbolRepo });

      await waitFor(() => expect(result.current.data).toEqual(symbols));
    });
  });
});

describe('[GIVEN] symbol repository return Left of error', () => {
  describe('[WHEN] use symbols hook', () => {
    it('[THEN] it will return error property equals to the error from repository', async () => {
      const error = createSymbolRepoError('GetSymbolsFailed', 'Mock');
      const symbolRepo: SymbolRepo = { getSymbols: jest.fn(te.left(error)) };
      const autoFetchEnabled = true;

      const { result } = renderUseSymbols(autoFetchEnabled, { symbolRepo });

      await waitFor(() => expect(result.current.error).toEqual(error));
    });
  });
});
