import { KlineModel } from '#features/btStrategies/dataModels/kline.js';

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

export type Indicators = {
  trend: {
    /** Simple moving average
     *  @param source   Series of values to process
     *  @param period   Number of bars
     */
    sma: (source: number[], period: number) => Promise<number[]>;
    /** Exponential moving average
     *  @param source   Series of values to process
     *  @param period   Number of bars
     */
    ema: (source: number[], period: number) => Promise<number[]>;
    /** Weighted moving average
     *  @param source   Series of values to process
     *  @param period   Number of bars
     */
    wma: (source: number[], period: number) => Promise<number[]>;
    /** Volume-weighted moving average
     *  @param source   Series of values to process
     *  @param period   Number of bars
     */
    vwma: (source: number[], period: number) => Promise<number[]>;
    /** Supertrend
     *  @param factor   Multiplier for ATR
     *  @param period   Period of ATR
     */
    supertrend: (fator: number, atrPeriod: number) => Promise<{ supertrend: number[]; direction: number[] }>;
    /** Parabolic SAR
     *  @param step     Acceleration increment step
     *  @param max      Maximum acceleration
     */
    psar: (step: number, max: number) => Promise<number[]>;
  };
  volume: {
    /** On balance volume */
    obv: () => Promise<number[]>;
    /** Price-volume trend */
    pvt: () => number[];
    /** Money flow index
     *  @param period     Number of bars
     */
    mfi: (period: number) => Promise<number[]>;
    /** Accumulation/Distribution line */
    ad: () => Promise<number[]>;
    /** Williams Accumulation/Distribution */
    wad: () => Promise<number[]>;
    /** Ease of movement */
    emv: () => Promise<number[]>;
    /** Volume weighted average price
     *  @param period     Number of bars
     */
    vwap: (period: number) => Promise<number[]>;
  };
  momentum: {
    /** Moving average Convergence/Divergence
     *  @param source           Series of values to process
     *  @param shortPeriod      Period of short EMA
     *  @param longPeriod       Period of long EMA
     *  @param signalPeriod     Period of signal
     */
    macd: (
      source: number[],
      shortPeriod: number,
      longPeriod: number,
      signalPeriod: number,
    ) => Promise<{ macd: number[]; signal: number[]; histogram: number[] }>;
    /** Relative strength index
     *  @param source     Series of values to process
     *  @param period     Number of bars
     */
    rsi: (source: number[], period: number) => Promise<number[]>;
    /** Average direction index
     *  @param period     Number of bars
     */
    adx: (period: number) => Promise<number[]>;
    /** Rate of change
     *  @param source     Series of values to process
     *  @param period     Number of bars
     */
    roc: (source: number[], period: number) => Promise<number[]>;
    /** Stochastic
     *  @param kPeriod    Period of moving average of %K
     *  @param kSlow      Period of slow oscillating %K
     *  @param dPeriod    Period of %D
     */
    stoch: (
      kPeriod: number,
      kSlow: number,
      dPeriod: number,
    ) => Promise<{ stoch: number[]; stochMa: number[] }>;
    /** Stochastic RSI
     *  @param source     Series of values to process
     *  @param period     Number of bars
     */
    stochRsi: (source: number[], period: number) => Promise<number[]>;
  };
  volatility: {
    /** Bollinger Band
     *  @param source     Series of values to process
     *  @param period     Number of bars
     *  @param stddev     Standard deviation factor
     */
    bb: (
      source: number[],
      period: number,
      stddev: number,
    ) => Promise<{ upper: number[]; middle: number[]; lower: number[] }>;
    /** Bollinger Bands Width
     *  @param bb     Bollinger Band values
     */
    bbw: (bb: { upper: number[]; middle: number[]; lower: number[] }) => number[];
    /** Keltner Channel
     *  @param period     Number of bars
     *  @param stddev     Standard deviation factor
     */
    kc: (period: number, stddev: number) => Promise<{ upper: number[]; middle: number[]; lower: number[] }>;
    /** Average True Range
     *  @param period     Number of bars
     */
    atr: (period: number) => Promise<number[]>;
  };
};

export function buildIndicators(klines: readonly KlineModel[]): Indicators {
  return {
    trend: {
      sma: sma,
      ema: ema,
      wma: wma,
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
      macd: macd,
      rsi: rsi,
      adx: (period) => adx(klines, period),
      roc: roc,
      stoch: (kPeriod, kSlow, dPeriod) => stoch(klines, kPeriod, kSlow, dPeriod),
      stochRsi: stochRsi,
    },
    volatility: {
      bb: bb,
      bbw: bbw,
      kc: (period, stddev) => kc(klines, period, stddev),
      atr: (period) => atr(klines, period),
    },
  };
}
