import { waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';

import { exchangeNameEnum } from '#features/exchanges/domain/exchange';
import { SymbolName } from '#features/symbols/domain/symbol';
import { ValidDate } from '#shared/utils/date';
import { generateArrayOf } from '#test-utils/faker';
import { mockKline } from '#test-utils/features/klines/kline';
import { renderHookWithContexts } from '#test-utils/render';

import { timeframeEnum } from '../kline';
import { KlineRepo } from '../kline.repository';
import { createKlineRepoError } from '../kline.repository.error';
import useKlines, { UseKlinesRequest } from './useKlines';

function renderUseKlines(
  request: UseKlinesRequest,
  autoFetchEnabled: boolean,
  overrides: { klineRepo: KlineRepo },
) {
  return renderHookWithContexts(() => useKlines(request, autoFetchEnabled), ['Infra', 'ServerState'], {
    infraContext: overrides,
  });
}

const request: UseKlinesRequest = {
  exchange: exchangeNameEnum.BINANCE,
  symbol: 'BTCUSDT' as SymbolName,
  timeframe: timeframeEnum['1d'],
  startTimestamp: new Date('2022-10-01') as ValidDate,
  endTimestamp: new Date('2022-10-02') as ValidDate,
};

describe('[GIVEN] enable auto fetching', () => {
  describe('[WHEN] use klines hook', () => {
    it('[THEN] it will start fetching data using kline repository', () => {
      const klineRepo: KlineRepo = { getKlines: jest.fn().mockReturnValue(te.right([])) };
      const autoFetchEnabled = true;

      renderUseKlines(request, autoFetchEnabled, { klineRepo });

      expect(klineRepo.getKlines).toHaveBeenCalled();
    });
  });
});

describe('[GIVEN] disable auto fetching', () => {
  describe('[WHEN] use klines hook', () => {
    it('[THEN] it will not fetch data', () => {
      const klineRepo: KlineRepo = { getKlines: jest.fn().mockReturnValue(te.right([])) };
      const autoFetchEnabled = false;

      renderUseKlines(request, autoFetchEnabled, { klineRepo });

      expect(klineRepo.getKlines).not.toHaveBeenCalled();
    });
  });
});

describe('[GIVEN] kline repository return Right of a list of klines', () => {
  describe('[WHEN] use klines hook', () => {
    it('[THEN] it will return data property equals to the list of klines', async () => {
      const klines = generateArrayOf(mockKline, 3);
      const klineRepo: KlineRepo = { getKlines: jest.fn().mockReturnValue(te.right(klines)) };
      const autoFetchEnabled = true;

      const { result } = renderUseKlines(request, autoFetchEnabled, { klineRepo });

      await waitFor(() => expect(result.current.data).toEqual(klines));
    });
  });
});

describe('[GIVEN] kline repository return Left of error', () => {
  describe('[WHEN] use klines hook', () => {
    it('[THEN] it will return error property equals to the error from repository', async () => {
      const error = createKlineRepoError('GetKlinesFailed', 'Mock');
      const klineRepo: KlineRepo = { getKlines: jest.fn().mockReturnValue(te.left(error)) };
      const autoFetchEnabled = true;

      const { result } = renderUseKlines(request, autoFetchEnabled, { klineRepo });

      await waitFor(() => expect(result.current.error).toEqual(error));
    });
  });
});
