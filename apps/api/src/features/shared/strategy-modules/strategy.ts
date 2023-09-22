import { z } from 'zod';

import { MaxNumKlines } from '#features/backtesting-strategies/data-models/btStrategy.js';
import { SymbolModel } from '#features/symbols/data-models/symbol.js';

import { ExchangeName } from '../domain/exchangeName.js';
import { Timeframe } from '../domain/timeframe.js';

export type StrategyModule = {
  name: string;
  exchange: ExchangeName;
  symbol: SymbolModel;
  timeframe: Timeframe;
  currency: Currency; // the currency used to calculate results
  initialCapital: number; // The amount of initial capital set in the strategy properties.
  takerFeeRate: FeeRate;
  makerFeeRate: FeeRate;
  maxNumKlines: MaxNumKlines;

  availableCapital: number;
  holdingAsset: number;

  netProfit: number; // Total currency value of all completed trades.
  openProfit: number; // Current unrealized profit or loss for all open positions.
  equity: number; // Current equity (strategy.initial_capital + strategy.netprofit + strategy.openprofit).

  grossProfit: number; // Total currency value of all completed winning trades.
  grossLoss: number; // Total currency value of all completed losing trades.

  maxDrawdown: number; // Maximum equity drawdown value for the whole trading interval.
  maxRunup: number; // Maximum equity run-up value for the whole trading interval.

  totalFees: number; // sum of entry and exit fees
};

export type Currency = string & z.BRAND<'Currency'>;
export type FeeRate = number & z.BRAND<'FeeRate'>;
