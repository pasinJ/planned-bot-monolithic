import { ReadonlyNonEmptyArray } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';

import type { TechnicalAnalysisModule } from '#SECT/TechnicalAnalysisModule.js';

import { Kline } from '../kline.js';
import { crossover, crossunder, falling, highest, lowest, rising } from '../technicalAnalysis/helpers.js';
import {
  ad,
  adx,
  atr,
  bb,
  bbw,
  ema,
  emv,
  kc,
  macd,
  mfi,
  momentum,
  obv,
  psar,
  pvt,
  roc,
  rsi,
  sma,
  stoch,
  stochRsi,
  supertrend,
  vwap,
  vwma,
  wad,
  wma,
} from '../technicalAnalysis/indicators.js';

export type { TechnicalAnalysisModule } from '#SECT/TechnicalAnalysisModule.js';

export function buildTechnicalAnalysisModule(klines: ReadonlyNonEmptyArray<Kline>): TechnicalAnalysisModule {
  return {
    crossover,
    crossunder,
    falling,
    rising,
    highest,
    lowest,
    trend: {
      sma,
      ema,
      wma,
      vwma: (source, period) => vwma(klines, source, period),
      supertrend: (factor, atrPeriod) => supertrend(klines, factor, atrPeriod),
      psar: (step, max) => psar(klines, step, max),
    },
    volume: {
      obv: () => obv(klines),
      pvt: () => pvt(klines),
      mfi: (period) => mfi(klines, period),
      ad: () => ad(klines),
      wad: () => wad(klines),
      emv: () => emv(klines),
      vwap: (period) => vwap(klines, period),
    },
    momentum: {
      momentum,
      macd,
      rsi,
      adx: (period) => adx(klines, period),
      roc,
      stoch: (kPeriod, kSlow, dPeriod) => stoch(klines, kPeriod, kSlow, dPeriod),
      stochRsi,
    },
    volatility: {
      bb,
      bbw,
      kc: (period, stddev) => kc(klines, period, stddev),
      atr: (period) => atr(klines, period),
    },
  };
}
