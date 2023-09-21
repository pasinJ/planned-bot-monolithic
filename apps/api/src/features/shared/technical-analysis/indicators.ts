import { IndicatorsNormalized } from '@ixjb94/indicators';
import { Decimal } from 'decimal.js';
import { append, defaultTo, prop, transpose, zipWith } from 'ramda';

import { KlineModel } from '#features/backtesting-strategies/data-models/kline.js';
import { getPrevItem } from '#shared/utils/general.js';
import { isUndefined } from '#shared/utils/typeGuards.js';

const ta = new IndicatorsNormalized();

/** Simple moving average
 *  @param source   Series of values to process
 *  @param period   Number of bars
 */
export function sma(source: number[], period: number): Promise<number[]> {
  return ta.sma(source, period);
}

/** Exponential moving average
 *  @param source   Series of values to process
 *  @param period   Number of bars
 */
export function ema(source: number[], period: number): Promise<number[]> {
  return ta.ema(source, period);
}

/** Weighted moving average
 *  @param source   Series of values to process
 *  @param period   Number of bars
 */
export function wma(source: number[], period: number): Promise<number[]> {
  return ta.wma(source, period);
}

/** Volume-weighted moving average
 *  @param klines   Series of klines (candlesticks)
 *  @param source   Series of values to process
 *  @param period   Number of bars
 */
export function vwma(klines: readonly KlineModel[], source: number[], period: number): Promise<number[]> {
  const { volumeSeries } = klines.reduce(
    ({ volumeSeries }, kline) => {
      return { volumeSeries: append(kline.volume, volumeSeries) };
    },
    { volumeSeries: [] as number[] },
  );

  return ta.vwma(source, volumeSeries, period);
}

/** Supertrend
 *  @param klines       Series of klines (candlesticks)
 *  @param factor       Multiplier for ATR
 *  @param atrPeriod    Period of ATR
 */
export async function supertrend(
  klines: readonly KlineModel[],
  factor: number,
  atrPeriod: number,
): Promise<{ supertrend: number[]; direction: number[] }> {
  const { highSeries, lowSeries, closeSeries } = klines.reduce(
    ({ highSeries, lowSeries, closeSeries }, kline) => {
      return {
        highSeries: append(kline.high, highSeries),
        lowSeries: append(kline.low, lowSeries),
        closeSeries: append(kline.close, closeSeries),
      };
    },
    { highSeries: [] as number[], lowSeries: [] as number[], closeSeries: [] as number[] },
  );
  const hl2Series = zipWith(
    (high, low) => new Decimal(high).plus(low).dividedBy(2).toNumber(),
    highSeries,
    lowSeries,
  );
  const atrSeries = await atr(klines, atrPeriod);

  const upperBandSeries = zipWith(
    (src, atr) => (isNaN(atr) ? NaN : new Decimal(factor).times(atr).plus(src).toNumber()),
    hl2Series,
    atrSeries,
  );
  const lowerBandSeries = zipWith(
    (src, atr) => (isNaN(atr) ? NaN : new Decimal(factor).times(atr).minus(src).toNumber()),
    hl2Series,
    atrSeries,
  );

  const { supertrendSeries, directionSeries } = closeSeries.reduce(
    ({ supertrendSeries, directionSeries }, close, index, closeSeries) => {
      let upperBand = upperBandSeries[index];
      let lowerBand = lowerBandSeries[index];

      const prevLowerBand = defaultTo(0, getPrevItem(lowerBandSeries, index));
      const prevUpperBand = defaultTo(0, getPrevItem(upperBandSeries, index));

      const prevClose = getPrevItem(closeSeries, index);
      lowerBand =
        prevClose && (lowerBand > prevLowerBand || prevClose < prevLowerBand) ? lowerBand : prevLowerBand;
      upperBand =
        prevClose && (upperBand < prevUpperBand || prevClose > prevUpperBand) ? upperBand : prevUpperBand;

      let direction: number;
      const prevSupertrend = getPrevItem(supertrendSeries, index);
      const prevAtr = getPrevItem(atrSeries, index);

      if (isUndefined(prevAtr) || isNaN(prevAtr)) {
        direction = 1;
      } else if (prevSupertrend === prevUpperBand) {
        direction = close > upperBand ? -1 : 1;
      } else {
        direction = close < lowerBand ? 1 : -1;
      }

      const supertrend = direction === -1 ? lowerBand : upperBand;

      return {
        supertrendSeries: append(supertrend, supertrendSeries),
        directionSeries: append(direction, directionSeries),
      };
    },
    { supertrendSeries: [] as number[], directionSeries: [] as number[] },
  );

  return { supertrend: supertrendSeries, direction: directionSeries };
}

/** Parabolic SAR
 *  @param klines   Series of klines (candlesticks)
 *  @param step     Acceleration increment step
 *  @param max      Maximum acceleration
 */
export function psar(klines: readonly KlineModel[], step: number, max: number): Promise<number[]> {
  const { highSeries, lowSeries } = klines.reduce(
    ({ highSeries, lowSeries }, kline) => {
      return { highSeries: append(kline.high, highSeries), lowSeries: append(kline.low, lowSeries) };
    },
    { highSeries: [] as number[], lowSeries: [] as number[] },
  );

  return ta.psar(highSeries, lowSeries, step, max);
}

/** On balance volume
 *  @param klines   Series of klines (candlesticks)
 */
export function obv(klines: readonly KlineModel[]): Promise<number[]> {
  const { closeSeries, volumeSeries } = klines.reduce(
    ({ closeSeries, volumeSeries }, kline) => {
      return {
        closeSeries: append(kline.close, closeSeries),
        volumeSeries: append(kline.volume, volumeSeries),
      };
    },
    { closeSeries: [] as number[], volumeSeries: [] as number[] },
  );

  return ta.obv(closeSeries, volumeSeries);
}

/** Price-volume trend
 *  @param klines   Series of klines (candlesticks)
 */
export function pvt(klines: readonly KlineModel[]): number[] {
  const { closeSeries, volumeSeries } = klines.reduce(
    ({ closeSeries, volumeSeries }, kline) => {
      return {
        closeSeries: append(kline.close, closeSeries),
        volumeSeries: append(kline.volume, volumeSeries),
      };
    },
    { closeSeries: [] as number[], volumeSeries: [] as number[] },
  );

  const { pvtSeries } = closeSeries.reduce(
    ({ pvtSeries, acc }, close, index) => {
      const prevClose = getPrevItem(closeSeries, index) ?? NaN;
      const closeChange = close - prevClose;
      const volume = volumeSeries[index];

      const pvt = new Decimal(closeChange).dividedBy(prevClose).times(volume).plus(acc).toNumber();

      return { pvtSeries: append(pvt, pvtSeries), acc: defaultTo(0, pvt) };
    },
    { pvtSeries: [] as number[], acc: 0 },
  );

  return pvtSeries;
}

/** Money flow index
 *  @param klines     Series of klines (candlesticks)
 *  @param period     Number of bars
 */
export function mfi(klines: readonly KlineModel[], period: number): Promise<number[]> {
  const { highSeries, lowSeries, closeSeries, volumeSeries } = klines.reduce(
    ({ highSeries, lowSeries, closeSeries, volumeSeries }, kline) => {
      return {
        highSeries: append(kline.high, highSeries),
        lowSeries: append(kline.low, lowSeries),
        closeSeries: append(kline.close, closeSeries),
        volumeSeries: append(kline.volume, volumeSeries),
      };
    },
    {
      highSeries: [] as number[],
      lowSeries: [] as number[],
      closeSeries: [] as number[],
      volumeSeries: [] as number[],
    },
  );

  return ta.mfi(highSeries, lowSeries, closeSeries, volumeSeries, period);
}

/** Accumulation/Distribution line
 *  @param klines     Series of klines (candlesticks)
 */
export function ad(klines: readonly KlineModel[]): Promise<number[]> {
  const { highSeries, lowSeries, closeSeries, volumeSeries } = klines.reduce(
    ({ highSeries, lowSeries, closeSeries, volumeSeries }, kline) => {
      return {
        highSeries: append(kline.high, highSeries),
        lowSeries: append(kline.low, lowSeries),
        closeSeries: append(kline.close, closeSeries),
        volumeSeries: append(kline.volume, volumeSeries),
      };
    },
    {
      highSeries: [] as number[],
      lowSeries: [] as number[],
      closeSeries: [] as number[],
      volumeSeries: [] as number[],
    },
  );

  return ta.ad(highSeries, lowSeries, closeSeries, volumeSeries);
}

/** Williams Accumulation/Distribution
 *  @param klines     Series of klines (candlesticks)
 */
export function wad(klines: readonly KlineModel[]): Promise<number[]> {
  const { highSeries, lowSeries, closeSeries } = klines.reduce(
    ({ highSeries, lowSeries, closeSeries }, kline) => {
      return {
        highSeries: append(kline.high, highSeries),
        lowSeries: append(kline.low, lowSeries),
        closeSeries: append(kline.close, closeSeries),
      };
    },
    {
      highSeries: [] as number[],
      lowSeries: [] as number[],
      closeSeries: [] as number[],
    },
  );

  return ta.wad(highSeries, lowSeries, closeSeries);
}

/** Ease of movement
 *  @param klines     Series of klines (candlesticks)
 */
export function emv(klines: readonly KlineModel[]): Promise<number[]> {
  const { highSeries, lowSeries, volumeSeries } = klines.reduce(
    ({ highSeries, lowSeries, volumeSeries }, kline) => {
      return {
        highSeries: append(kline.high, highSeries),
        lowSeries: append(kline.low, lowSeries),
        volumeSeries: append(kline.volume, volumeSeries),
      };
    },
    {
      highSeries: [] as number[],
      lowSeries: [] as number[],
      volumeSeries: [] as number[],
    },
  );

  return ta.emv(highSeries, lowSeries, volumeSeries);
}

/** Volume weighted average price
 *  @param klines     Series of klines (candlesticks)
 *  @param period     Number of bars
 */
export function vwap(klines: readonly KlineModel[], period: number): Promise<number[]> {
  const { highSeries, lowSeries, closeSeries, volumeSeries } = klines.reduce(
    ({ highSeries, lowSeries, closeSeries, volumeSeries }, kline) => {
      return {
        highSeries: append(kline.high, highSeries),
        lowSeries: append(kline.low, lowSeries),
        closeSeries: append(kline.close, closeSeries),
        volumeSeries: append(kline.volume, volumeSeries),
      };
    },
    {
      highSeries: [] as number[],
      lowSeries: [] as number[],
      closeSeries: [] as number[],
      volumeSeries: [] as number[],
    },
  );

  return ta.vwap(highSeries, lowSeries, closeSeries, volumeSeries, period);
}

/** Moving average Convergence/Divergence
 *  @param source           Series of values to process
 *  @param shortPeriod      Period of short EMA
 *  @param longPeriod       Period of long EMA
 *  @param signalPeriod     Period of signal
 */
export async function macd(
  source: number[],
  shortPeriod: number,
  longPeriod: number,
  signalPeriod: number,
): Promise<{ macd: number[]; signal: number[]; histogram: number[] }> {
  const [macd, signal, histogram] = await ta.macd(source, shortPeriod, longPeriod, signalPeriod);
  return { macd, signal, histogram };
}

/** Relative strength index
 *  @param source     Series of values to process
 *  @param period     Number of bars
 */
export function rsi(source: number[], period: number): Promise<number[]> {
  return ta.rsi(source, period);
}

/** Average direction index
 *  @param klines     Series of klines (candlesticks)
 *  @param period     Number of bars
 */
export function adx(klines: readonly KlineModel[], period: number): Promise<number[]> {
  const { highSeries, lowSeries } = klines.reduce(
    ({ highSeries, lowSeries }, kline) => {
      return {
        highSeries: append(kline.high, highSeries),
        lowSeries: append(kline.low, lowSeries),
      };
    },
    {
      highSeries: [] as number[],
      lowSeries: [] as number[],
    },
  );

  return ta.adx(highSeries, lowSeries, period);
}

/** Rate of change
 *  @param source     Series of values to process
 *  @param period     Number of bars
 */
export function roc(source: number[], period: number): Promise<number[]> {
  return ta.roc(source, period);
}

/** Stochastic Oscillator
 *  @param kPeriod    Period of moving average of %K
 *  @param kSlow      Period of slow oscillating %K
 *  @param dPeriod    Period of %D
 */
export async function stoch(
  klines: readonly KlineModel[],
  kPeriod: number,
  kSlow: number,
  dPeriod: number,
): Promise<{ stoch: number[]; stochMa: number[] }> {
  const { highSeries, lowSeries, closeSeries } = klines.reduce(
    ({ highSeries, lowSeries, closeSeries }, kline) => {
      return {
        highSeries: append(kline.high, highSeries),
        lowSeries: append(kline.low, lowSeries),
        closeSeries: append(kline.close, closeSeries),
      };
    },
    {
      highSeries: [] as number[],
      lowSeries: [] as number[],
      closeSeries: [] as number[],
    },
  );
  const [stoch, stochMa] = await ta.stoch(highSeries, lowSeries, closeSeries, kPeriod, kSlow, dPeriod);

  return { stoch, stochMa };
}

/** Stochastic RSI
 *  @param source     Series of values to process
 *  @param period     Number of bars
 */
export async function stochRsi(source: number[], period: number): Promise<number[]> {
  return ta.stochrsi(source, period);
}

/** Bollinger Band
 *  @param source     Series of values to process
 *  @param period     Number of bars
 *  @param stddev     Standard deviation factor
 */
export async function bb(
  source: number[],
  period: number,
  stddev: number,
): Promise<{ upper: number[]; middle: number[]; lower: number[] }> {
  const [lower, middle, upper] = await ta.bbands(source, period, stddev);
  return {
    lower: Array.from(lower, (item) => item || NaN),
    middle: Array.from(middle, (item) => item || NaN),
    upper: Array.from(upper, (item) => item || NaN),
  };
}

/** Bollinger Bands Width
 *  @param bb     Bollinger Band values
 */
export function bbw(bb: { upper: number[]; middle: number[]; lower: number[] }): number[] {
  return transpose([bb.upper, bb.middle, bb.lower]).map(([upper, middle, lower]) => {
    return new Decimal(upper).minus(lower).dividedBy(middle).toNumber();
  });
}

/** Keltner Channel
 *  @param klines     Series of klines (candlesticks)
 *  @param period     Number of bars
 *  @param stddev     Standard deviation factor
 */
export async function kc(
  klines: readonly KlineModel[],
  period: number,
  stddev: number,
): Promise<{ upper: number[]; middle: number[]; lower: number[] }> {
  const { highSeries, lowSeries, closeSeries } = klines.reduce(
    ({ highSeries, lowSeries, closeSeries }, kline) => {
      return {
        highSeries: append(kline.high, highSeries),
        lowSeries: append(kline.low, lowSeries),
        closeSeries: append(kline.close, closeSeries),
      };
    },
    {
      highSeries: [] as number[],
      lowSeries: [] as number[],
      closeSeries: [] as number[],
    },
  );

  const [lower, middle, upper] = await ta.kc(highSeries, lowSeries, closeSeries, period, stddev);
  return { lower, middle, upper };
}

/** Average True Range
 *  @param klines     Series of klines (candlesticks)
 *  @param period     Number of bars
 */
export function atr(klines: readonly KlineModel[], period: number): Promise<number[]> {
  return ta.atr(klines.map(prop('high')), klines.map(prop('low')), klines.map(prop('close')), period);
}
