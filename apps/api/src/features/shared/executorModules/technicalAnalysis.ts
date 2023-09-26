import { ReadonlyNonEmptyArray } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';
import { DeepReadonly } from 'ts-essentials';

import { KlineModel } from '#features/btStrategies/dataModels/kline.js';

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

export type TechnicalAnalysisModule = {
  /** Check if the first array cross over the second array at the last value */
  crossover: (arr1: readonly number[], arr2: readonly number[]) => boolean;
  /** Check if the first array cross under the second array at the last value */
  crossunder: (arr1: readonly number[], arr2: readonly number[]) => boolean;
  /** Check if the `source` array is now falling (continuously decrease) for `period` values long. */
  falling: (source: readonly number[], period: number) => boolean;
  /** Check if the `source` array is now rising (continuously increase) for `period` values long. */
  rising: (source: readonly number[], period: number) => boolean;
  /** Get highest value of the given number of `period` values back. */
  highest: <T extends number>(source: readonly T[], period: number) => T | undefined;
  /** Get lowest value of the given number of `period` values back. */
  lowest: <T extends number>(source: readonly T[], period: number) => T | undefined;
  trend: {
    /** Simple moving average
     *  @param source   Series of values to process
     *  @param period   Number of bars
     */
    sma: (source: readonly number[], period: number) => Promise<readonly number[]>;
    /** Exponential moving average
     *  @param source   Series of values to process
     *  @param period   Number of bars
     */
    ema: (source: readonly number[], period: number) => Promise<readonly number[]>;
    /** Weighted moving average
     *  @param source   Series of values to process
     *  @param period   Number of bars
     */
    wma: (source: readonly number[], period: number) => Promise<readonly number[]>;
    /** Volume-weighted moving average
     *  @param source   Series of values to process
     *  @param period   Number of bars
     */
    vwma: (source: readonly number[], period: number) => Promise<readonly number[]>;
    /** Supertrend
     *  @param factor   Multiplier for ATR
     *  @param period   Period of ATR
     */
    supertrend: (
      fator: number,
      atrPeriod: number,
    ) => Promise<DeepReadonly<{ supertrend: number[]; direction: number[] }>>;
    /** Parabolic SAR
     *  @param step     Acceleration increment step
     *  @param max      Maximum acceleration
     */
    psar: (step: number, max: number) => Promise<readonly number[]>;
  };
  volume: {
    /** On balance volume */
    obv: () => Promise<readonly number[]>;
    /** Price-volume trend */
    pvt: () => readonly number[];
    /** Money flow index
     *  @param period     Number of bars
     */
    mfi: (period: number) => Promise<readonly number[]>;
    /** Accumulation/Distribution line */
    ad: () => Promise<readonly number[]>;
    /** Williams Accumulation/Distribution */
    wad: () => Promise<readonly number[]>;
    /** Ease of movement */
    emv: () => Promise<readonly number[]>;
    /** Volume weighted average price
     *  @param period     Number of bars
     */
    vwap: (period: number) => Promise<readonly number[]>;
  };
  momentum: {
    /** Momentum
     *  @param source           Series of values to process
     *  @param period           Period of value to compare
     */
    momentum: (source: readonly number[], period: number) => Promise<readonly number[]>;
    /** Moving average Convergence/Divergence
     *  @param source           Series of values to process
     *  @param shortPeriod      Period of short EMA
     *  @param longPeriod       Period of long EMA
     *  @param signalPeriod     Period of signal
     */
    macd: (
      source: readonly number[],
      shortPeriod: number,
      longPeriod: number,
      signalPeriod: number,
    ) => Promise<DeepReadonly<{ macd: number[]; signal: number[]; histogram: number[] }>>;
    /** Relative strength index
     *  @param source     Series of values to process
     *  @param period     Number of bars
     */
    rsi: (source: readonly number[], period: number) => Promise<readonly number[]>;
    /** Average direction index
     *  @param period     Number of bars
     */
    adx: (period: number) => Promise<readonly number[]>;
    /** Rate of change
     *  @param source     Series of values to process
     *  @param period     Number of bars
     */
    roc: (source: readonly number[], period: number) => Promise<readonly number[]>;
    /** Stochastic
     *  @param kPeriod    Period of moving average of %K
     *  @param kSlow      Period of slow oscillating %K
     *  @param dPeriod    Period of %D
     */
    stoch: (
      kPeriod: number,
      kSlow: number,
      dPeriod: number,
    ) => Promise<DeepReadonly<{ stoch: number[]; stochMa: number[] }>>;
    /** Stochastic RSI
     *  @param source     Series of values to process
     *  @param period     Number of bars
     */
    stochRsi: (source: readonly number[], period: number) => Promise<readonly number[]>;
  };
  volatility: {
    /** Bollinger Band
     *  @param source     Series of values to process
     *  @param period     Number of bars
     *  @param stddev     Standard deviation factor
     */
    bb: (
      source: readonly number[],
      period: number,
      stddev: number,
    ) => Promise<DeepReadonly<{ upper: number[]; middle: number[]; lower: number[] }>>;
    /** Bollinger Bands Width
     *  @param bb     Bollinger Band values
     */
    bbw: (bb: DeepReadonly<{ upper: number[]; middle: number[]; lower: number[] }>) => readonly number[];
    /** Keltner Channel
     *  @param period     Number of bars
     *  @param stddev     Standard deviation factor
     */
    kc: (
      period: number,
      stddev: number,
    ) => Promise<DeepReadonly<{ upper: number[]; middle: number[]; lower: number[] }>>;
    /** Average True Range
     *  @param period     Number of bars
     */
    atr: (period: number) => Promise<readonly number[]>;
  };
};

export function buildTechnicalAnalysisModule(
  klines: ReadonlyNonEmptyArray<KlineModel>,
): TechnicalAnalysisModule {
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
