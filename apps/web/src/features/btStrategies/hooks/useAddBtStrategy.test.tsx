import { act, waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';

import { exchangeNameEnum } from '#features/exchanges/exchange';
import { timeframeEnum } from '#features/klines/kline';
import { BaseAsset, SymbolName } from '#features/symbols/symbol';
import { DateService } from '#infra/dateService';
import { ValidDate } from '#shared/utils/date';
import { DecimalString, IntegerString, TimezoneString } from '#shared/utils/string';
import { renderHookWithContexts } from '#test-utils/render';

import { BtStrategyRepo } from '../btStrategy.repository';
import { createBtStrategyRepoError } from '../btStrategy.repository.error';
import useAddBtStrategy, { UseAddBtStrategyRequest } from './useAddBtStrategy';

function renderUseAddBtStrategy(overrides: {
  btStrategyRepo: Partial<BtStrategyRepo>;
  dateService: Partial<DateService>;
}) {
  return renderHookWithContexts(() => useAddBtStrategy(), ['Infra', 'ServerState'], {
    infraContext: overrides,
  });
}

const request: UseAddBtStrategyRequest = {
  name: 'strategy name',
  exchange: exchangeNameEnum.BINANCE,
  symbol: 'BNBUSDT' as SymbolName,
  timeframe: timeframeEnum['15m'],
  maxNumKlines: '100' as IntegerString,
  startTimestamp: new Date('2010-02-03') as ValidDate,
  endTimestamp: new Date('2010-02-04') as ValidDate,
  capitalCurrency: 'BNB' as BaseAsset,
  initialCapital: '100.1' as DecimalString,
  takerFeeRate: '0.1' as DecimalString,
  makerFeeRate: '0.1' as DecimalString,
  language: 'javascript',
  body: 'console.log("Hi")',
};

describe('[WHEN] adding backtesting strategy', () => {
  it('[THEN] it will call backtesting strategy repository with correct parameters', async () => {
    const btStrategyRepo: Partial<BtStrategyRepo> = {
      addBtStrategy: jest.fn().mockReturnValue(te.right({ id: 'id', createdAt: new Date('2020-02-02') })),
    };
    const timezone = 'Asia/Bangkok' as TimezoneString;
    const dateService: Partial<DateService> = { getTimezone: () => timezone };
    const { result } = renderUseAddBtStrategy({ btStrategyRepo, dateService });

    act(() => result.current.mutate(request));

    await waitFor(() =>
      expect(btStrategyRepo.addBtStrategy).toHaveBeenCalledExactlyOnceWith({
        name: 'strategy name',
        exchange: exchangeNameEnum.BINANCE,
        symbol: 'BNBUSDT',
        timeframe: timeframeEnum['15m'],
        maxNumKlines: 100,
        startTimestamp: new Date('2010-02-03'),
        endTimestamp: new Date('2010-02-04'),
        timezone,
        capitalCurrency: 'BNB',
        initialCapital: 100.1,
        takerFeeRate: 0.1,
        makerFeeRate: 0.1,
        language: 'javascript',
        body: 'console.log("Hi")',
      }),
    );
  });
});

describe('[GIVEN] backtesting strategy repository return Right of result', () => {
  describe('[WHEN] adding backtesting strategy', () => {
    it('[THEN] it will return data property equals to the result', async () => {
      const addResult = { id: 'id', createdAt: new Date('2020-02-02') };
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        addBtStrategy: jest.fn().mockReturnValue(te.right(addResult)),
      };
      const dateService: Partial<DateService> = { getTimezone: () => 'Asia/Bangkok' as TimezoneString };
      const { result } = renderUseAddBtStrategy({ btStrategyRepo, dateService });

      act(() => result.current.mutate(request));

      await waitFor(() => expect(result.current.data).toEqual(addResult));
    });
  });
});

describe('[GIVEN] backtesting strategy repository return Left of error', () => {
  describe('[WHEN] adding backtesting strategy', () => {
    it('[THEN] it will return error property equals to the error', async () => {
      const error = createBtStrategyRepoError('AddBtStrategyFailed', 'Mock');
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        addBtStrategy: jest.fn().mockReturnValue(te.left(error)),
      };
      const dateService: Partial<DateService> = { getTimezone: () => 'Asia/Bangkok' as TimezoneString };
      const { result } = renderUseAddBtStrategy({ btStrategyRepo, dateService });

      act(() => result.current.mutate(request));

      await waitFor(() => expect(result.current.error).toEqual(error));
    });
  });
});
