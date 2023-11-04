import { act, waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';
import { generatePath, useParams } from 'react-router-dom';

import { exchangeNameEnum } from '#features/exchanges/exchange';
import { timeframeEnum } from '#features/klines/kline';
import { SymbolName } from '#features/symbols/symbol';
import { DateService } from '#infra/dateService';
import { BACKTEST_STRATEGY_ROUTE } from '#routes/routes.constant';
import { TimezoneString } from '#shared/utils/string';
import { renderHookWithContexts } from '#test-utils/render';

import {
  AssetCurrency,
  BtRange,
  BtStrategyBody,
  BtStrategyName,
  CapitalCurrency,
  InitialCapital,
  MakerFeeRate,
  MaxNumKlines,
  TakerFeeRate,
} from '../btStrategy';
import { BtStrategyRepo } from '../btStrategy.repository';
import { createBtStrategyRepoError } from '../btStrategy.repository.error';
import useSaveBtStrategy, { UseSaveBtStrategyRequest } from './useSaveBtStrategy';

function renderUseSaveBtStrategy(
  overrides: { btStrategyRepo: Partial<BtStrategyRepo>; dateService: Partial<DateService> },
  currentPath: string,
) {
  return renderHookWithContexts(
    () => ({ saveHook: useSaveBtStrategy(), paramsHook: useParams() }),
    ['Infra', 'ServerState', 'Routes'],
    {
      infraContext: overrides,
      routes: { uiPath: BACKTEST_STRATEGY_ROUTE, currentPath },
    },
  );
}

const request: UseSaveBtStrategyRequest = {
  name: 'strategy name' as BtStrategyName,
  exchange: exchangeNameEnum.BINANCE,
  symbol: 'BNBUSDT' as SymbolName,
  timeframe: timeframeEnum['15m'],
  maxNumKlines: 100 as MaxNumKlines,
  btRange: { start: new Date('2010-02-03'), end: new Date('2010-02-04') } as BtRange,
  assetCurrency: 'USDT' as AssetCurrency,
  capitalCurrency: 'BNB' as CapitalCurrency,
  initialCapital: 100.1 as InitialCapital,
  takerFeeRate: 0.1 as TakerFeeRate,
  makerFeeRate: 0.1 as MakerFeeRate,
  language: 'javascript',
  body: 'console.log("Hi")' as BtStrategyBody,
};

describe('[GIVEN] the current path does not contain ID', () => {
  describe('[WHEN] use save backtesting strategy hook', () => {
    it('[THEN] it will call backtesting repository for adding with correct request', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        addBtStrategy: jest.fn().mockReturnValue(te.right(undefined)),
      };
      const timezone = 'UTC' as TimezoneString;
      const dateService: Partial<DateService> = { getTimezone: () => timezone };
      const path = generatePath(BACKTEST_STRATEGY_ROUTE);
      const { result } = renderUseSaveBtStrategy({ btStrategyRepo, dateService }, path);

      act(() => result.current.saveHook.mutate(request));

      await waitFor(() =>
        expect(btStrategyRepo.addBtStrategy).toHaveBeenCalledExactlyOnceWith({ ...request, timezone }),
      );
    });
  });
});

describe('[GIVEN] the current path does not contain ID [AND] backtesting strategy repository return Right of ID and creation timestamp', () => {
  const id = 'dJRa73MhjX';
  const createdAt = new Date('2022-03-04');
  const btStrategyRepo: Partial<BtStrategyRepo> = {
    addBtStrategy: jest.fn().mockReturnValue(te.right({ id, createdAt })),
  };
  const timezone = 'UTC' as TimezoneString;
  const dateService: Partial<DateService> = { getTimezone: () => timezone };
  const path = generatePath(BACKTEST_STRATEGY_ROUTE);

  describe('[WHEN] use save backtesting strategy hook', () => {
    it('[THEN] it will set ID params to the returned ID', async () => {
      const { result } = renderUseSaveBtStrategy({ btStrategyRepo, dateService }, path);

      act(() => result.current.saveHook.mutate(request));

      await waitFor(() => expect(result.current.paramsHook).toEqual({ btStrategyId: id }));
    });
    it('[THEN] it will return the ID', async () => {
      const { result } = renderUseSaveBtStrategy({ btStrategyRepo, dateService }, path);

      act(() => result.current.saveHook.mutate(request));

      await waitFor(() => expect(result.current.saveHook.data).toEqual(id));
    });
  });
});

describe('[GIVEN] the current path does not contain ID [AND] backtesting strategy repository return Left of error', () => {
  describe('[WHEN] use save backtesting strategy hook', () => {
    it('[THEN] it will return the error of repository', async () => {
      const error = createBtStrategyRepoError('AddBtStrategyFailed', 'Mock');
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        addBtStrategy: jest.fn().mockReturnValue(te.left(error)),
      };
      const timezone = 'UTC' as TimezoneString;
      const dateService: Partial<DateService> = { getTimezone: () => timezone };
      const path = generatePath(BACKTEST_STRATEGY_ROUTE);
      const { result } = renderUseSaveBtStrategy({ btStrategyRepo, dateService }, path);

      act(() => result.current.saveHook.mutate(request));

      await waitFor(() => expect(result.current.saveHook.error).toEqual(error));
    });
  });
});

describe('[GIVEN] the current path contains ID', () => {
  describe('[WHEN] use save backtesting strategy hook', () => {
    it('[THEN] it will call backtesting repository for updating with correct request', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        updateBtStrategy: jest.fn().mockReturnValue(te.right(undefined)),
      };
      const timezone = 'UTC' as TimezoneString;
      const dateService: Partial<DateService> = { getTimezone: () => timezone };
      const id = 'newId';
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { btStrategyId: id });
      const { result } = renderUseSaveBtStrategy({ btStrategyRepo, dateService }, path);

      act(() => result.current.saveHook.mutate(request));

      await waitFor(() =>
        expect(btStrategyRepo.updateBtStrategy).toHaveBeenCalledExactlyOnceWith({ ...request, id, timezone }),
      );
    });
  });
});

describe('[GIVEN] the current path contains ID [AND] backtesting strategy repository return Right of undefined', () => {
  describe('[WHEN] use save backtesting strategy hook', () => {
    it('[THEN] it will return the ID', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        updateBtStrategy: jest.fn().mockReturnValue(te.right(undefined)),
      };
      const timezone = 'UTC' as TimezoneString;
      const dateService: Partial<DateService> = { getTimezone: () => timezone };
      const id = 'newId';
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { btStrategyId: id });
      const { result } = renderUseSaveBtStrategy({ btStrategyRepo, dateService }, path);

      act(() => result.current.saveHook.mutate(request));

      await waitFor(() => expect(result.current.saveHook.data).toBe(id));
    });
  });
});

describe('[GIVEN] the current path contains ID [AND] backtesting strategy repository return Left of error', () => {
  describe('[WHEN] use save backtesting strategy hook', () => {
    it('[THEN] it will return the error of repository', async () => {
      const error = createBtStrategyRepoError('UpdateBtStrategyFailed', 'Mock');
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        updateBtStrategy: jest.fn().mockReturnValue(te.left(error)),
      };
      const timezone = 'UTC' as TimezoneString;
      const dateService: Partial<DateService> = { getTimezone: () => timezone };
      const id = 'newId';
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { btStrategyId: id });
      const { result } = renderUseSaveBtStrategy({ btStrategyRepo, dateService }, path);

      act(() => result.current.saveHook.mutate(request));

      await waitFor(() => expect(result.current.saveHook.error).toEqual(error));
    });
  });
});
