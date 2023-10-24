import { act, waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';
import { generatePath } from 'react-router-dom';

import { exchangeNameEnum } from '#features/exchanges/exchange';
import { timeframeEnum } from '#features/klines/kline';
import { BaseAsset, SymbolName } from '#features/symbols/symbol';
import { DateService } from '#infra/dateService';
import { BACKTEST_STRATEGY_ROUTE } from '#routes/routes.constant';
import { isGeneralError } from '#shared/errors/generalError';
import { ValidDate } from '#shared/utils/date';
import { DecimalString, IntegerString, TimezoneString } from '#shared/utils/string';
import { renderHookWithContexts } from '#test-utils/render';

import { BtStrategyRepo } from '../btStrategy.repository';
import { createBtStrategyRepoError } from '../btStrategy.repository.error';
import useUpdateBtStrategy, { UseUpdateBtStrategyRequest } from './useUpdateBtStrategy';

function renderUseUpdateBtStrategy(
  overrides: { btStrategyRepo: Partial<BtStrategyRepo>; dateService: Partial<DateService> },
  currentPath: string,
) {
  return renderHookWithContexts(() => useUpdateBtStrategy(), ['Infra', 'ServerState', 'Routes'], {
    infraContext: overrides,
    routes: { uiPath: BACKTEST_STRATEGY_ROUTE, currentPath },
  });
}

const request: UseUpdateBtStrategyRequest = {
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

describe('[GIVEN] the current path does not contain ID', () => {
  describe('[WHEN] use update backtesting strategy hook', () => {
    it('[THEN] it will return error property with error', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        updateBtStrategy: jest.fn().mockReturnValue(te.right(undefined)),
      };
      const dateService: Partial<DateService> = { getTimezone: () => 'UTC' as TimezoneString };
      const path = generatePath(BACKTEST_STRATEGY_ROUTE);
      const { result } = renderUseUpdateBtStrategy({ btStrategyRepo, dateService }, path);

      act(() => result.current.mutate(request));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(expect.toSatisfy(isGeneralError));
    });
  });
});

describe('[GIVEN] the current path contains ID', () => {
  describe('[WHEN] use update backtesting strategy hook', () => {
    it('[THEN] it will call backtesting repository for updating with correct request', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        updateBtStrategy: jest.fn().mockReturnValue(te.right(undefined)),
      };
      const timezone = 'UTC' as TimezoneString;
      const dateService: Partial<DateService> = { getTimezone: () => timezone };
      const id = 'newId';
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { id });
      const { result } = renderUseUpdateBtStrategy({ btStrategyRepo, dateService }, path);

      act(() => result.current.mutate(request));

      await waitFor(() =>
        expect(btStrategyRepo.updateBtStrategy).toHaveBeenCalledExactlyOnceWith({
          id,
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
});

describe('[GIVEN] backtesting strategy repository return Right of undefined', () => {
  describe('[WHEN] update backtesting strategy', () => {
    it('[THEN] it will return isSuccess equals to true', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        updateBtStrategy: jest.fn().mockReturnValue(te.right(undefined)),
      };
      const dateService: Partial<DateService> = { getTimezone: () => 'UTC' as TimezoneString };
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { id: 'newId' });
      const { result } = renderUseUpdateBtStrategy({ btStrategyRepo, dateService }, path);

      act(() => result.current.mutate(request));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});

describe('[GIVEN] backtesting strategy repository return Left of error', () => {
  describe('[WHEN] update backtesting strategy', () => {
    it('[THEN] it will return error equals to the repository error', async () => {
      const error = createBtStrategyRepoError('UpdateBtStrategyFailed', 'Mock');
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        updateBtStrategy: jest.fn().mockReturnValue(te.left(error)),
      };
      const dateService: Partial<DateService> = { getTimezone: () => 'UTC' as TimezoneString };
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { id: 'newId' });
      const { result } = renderUseUpdateBtStrategy({ btStrategyRepo, dateService }, path);

      act(() => result.current.mutate(request));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });
  });
});
