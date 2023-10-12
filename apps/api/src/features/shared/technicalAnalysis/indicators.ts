import { IndicatorsNormalized } from '@ixjb94/indicators';
import { Decimal } from 'decimal.js';
import { append, clone, defaultTo, prop, transpose, zipWith } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import { getPrevItem, isUndefined } from '#shared/utils/general.js';

import { Kline } from '../kline.js';

const ta = new IndicatorsNormalized();

/** Simple moving average
 *  @param source   Series of values to process
 *  @param period   Number of bars
 */
export async function sma(source: readonly number[], period: number): Promise<readonly number[]> {
  return replaceEmptyItemWithNaN(await ta.sma(clone(source), period));
}

/** Exponential moving average
 *  @param source   Series of values to process
 *  @param period   Number of bars
 */
export function ema(source: readonly number[], period: number): Promise<readonly number[]> {
  return ta.ema(clone(source), period);
}

/** Weighted moving average
 *  @param source   Series of values to process
 *  @param period   Number of bars
 */
export async function wma(source: readonly number[], period: number): Promise<readonly number[]> {
  return replaceEmptyItemWithNaN(await ta.wma(clone(source), period));
}

/** Volume-weighted moving average
 *  @param klines   Series of klines (candlesticks)
 *  @param source   Series of values to process
 *  @param period   Number of bars
 */
export async function vwma(
  klines: readonly Kline[],
  source: readonly number[],
  period: number,
): Promise<readonly number[]> {
  const { volumeSeries } = klines.reduce(
    ({ volumeSeries }, kline) => {
      return { volumeSeries: append(kline.volume, volumeSeries) };
    },
    { volumeSeries: [] as number[] },
  );

  return replaceEmptyItemWithNaN(await ta.vwma(clone(source), volumeSeries, period));
}

/** Supertrend
 *  @param klines       Series of klines (candlesticks)
 *  @param factor       Multiplier for ATR
 *  @param atrPeriod    Period of ATR
 */
export async function supertrend(
  klines: readonly Kline[],
  factor: number,
  atrPeriod: number,
): Promise<DeepReadonly<{ supertrend: number[]; direction: number[] }>> {
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

  const { supertrendSeries, directionSeries } = closeSeries.reduce(
    ({ upperBandSeries, lowerBandSeries, supertrendSeries, directionSeries }, close, index) => {
      const atr = atrSeries[index];
      const src = hl2Series[index];

      let upperBand = isNaN(atr) ? NaN : new Decimal(src).plus(new Decimal(factor).times(atr)).toNumber();
      let lowerBand = isNaN(atr) ? NaN : new Decimal(src).minus(new Decimal(factor).times(atr)).toNumber();

      const prevLowerBand = defaultTo(0, getPrevItem(lowerBandSeries, index));
      const prevUpperBand = defaultTo(0, getPrevItem(upperBandSeries, index));

      const prevClose = getPrevItem(closeSeries, index);
      lowerBand =
        lowerBand > prevLowerBand || (prevClose && prevClose < prevLowerBand) ? lowerBand : prevLowerBand;
      upperBand =
        upperBand < prevUpperBand || (prevClose && prevClose > prevUpperBand) ? upperBand : prevUpperBand;

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
        upperBandSeries: append(upperBand, upperBandSeries),
        lowerBandSeries: append(lowerBand, lowerBandSeries),
        supertrendSeries: append(supertrend, supertrendSeries),
        directionSeries: append(direction, directionSeries),
      };
    },
    {
      upperBandSeries: [] as number[],
      lowerBandSeries: [] as number[],
      supertrendSeries: [] as number[],
      directionSeries: [] as number[],
    },
  );

  return { supertrend: supertrendSeries, direction: directionSeries };
}

/** Parabolic SAR
 *  @param klines   Series of klines (candlesticks)
 *  @param step     Acceleration increment step
 *  @param max      Maximum acceleration
 */
export function psar(klines: readonly Kline[], step: number, max: number): Promise<readonly number[]> {
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
export function obv(klines: readonly Kline[]): Promise<readonly number[]> {
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
export function pvt(klines: readonly Kline[]): readonly number[] {
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
export async function mfi(klines: readonly Kline[], period: number): Promise<readonly number[]> {
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

  return replaceEmptyItemWithNaN(await ta.mfi(highSeries, lowSeries, closeSeries, volumeSeries, period));
}

/** Accumulation/Distribution line
 *  @param klines     Series of klines (candlesticks)
 */
export function ad(klines: readonly Kline[]): Promise<readonly number[]> {
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
export function wad(klines: readonly Kline[]): Promise<readonly number[]> {
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
export function emv(klines: readonly Kline[]): Promise<readonly number[]> {
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
export async function vwap(klines: readonly Kline[], period: number): Promise<readonly number[]> {
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

  return replaceEmptyItemWithNaN(await ta.vwap(highSeries, lowSeries, closeSeries, volumeSeries, period));
}

/** Momentum
 *  @param source           Series of values to process
 *  @param period           Period of value to compare
 */
export async function momentum(source: readonly number[], period: number): Promise<readonly number[]> {
  return replaceEmptyItemWithNaN(await ta.mom(clone(source), period));
}

/** Moving average Convergence/Divergence
 *  @param source           Series of values to process
 *  @param shortPeriod      Period of short EMA
 *  @param longPeriod       Period of long EMA
 *  @param signalPeriod     Period of signal
 */
export async function macd(
  source: readonly number[],
  shortPeriod: number,
  longPeriod: number,
  signalPeriod: number,
): Promise<DeepReadonly<{ macd: number[]; signal: number[]; histogram: number[] }>> {
  const [macd, signal, histogram] = await ta.macd(clone(source), shortPeriod, longPeriod, signalPeriod);
  return {
    macd: replaceEmptyItemWithNaN(macd),
    signal: replaceEmptyItemWithNaN(signal),
    histogram: replaceEmptyItemWithNaN(histogram),
  };
}

/** Relative strength index
 *  @param source     Series of values to process
 *  @param period     Number of bars
 */
export async function rsi(source: readonly number[], period: number): Promise<readonly number[]> {
  return replaceEmptyItemWithNaN(await ta.rsi(clone(source), period));
}

/** Average direction index
 *  @param klines     Series of klines (candlesticks)
 *  @param period     Number of bars
 */
export async function adx(klines: readonly Kline[], period: number): Promise<readonly number[]> {
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

  return replaceEmptyItemWithNaN(await ta.adx(highSeries, lowSeries, period));
}

/** Rate of change
 *  @param source     Series of values to process
 *  @param period     Number of bars
 */
export async function roc(source: readonly number[], period: number): Promise<readonly number[]> {
  return replaceEmptyItemWithNaN(await ta.roc(clone(source), period));
}

/** Stochastic Oscillator
 *  @param kPeriod    Period of moving average of %K
 *  @param kSlow      Period of slow oscillating %K
 *  @param dPeriod    Period of %D
 */
export async function stoch(
  klines: readonly Kline[],
  kPeriod: number,
  kSlow: number,
  dPeriod: number,
): Promise<DeepReadonly<{ stoch: number[]; stochMa: number[] }>> {
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

  return { stoch: replaceEmptyItemWithNaN(stoch), stochMa: replaceEmptyItemWithNaN(stochMa) };
}

/** Stochastic RSI
 *  @param source     Series of values to process
 *  @param period     Number of bars
 */
export async function stochRsi(source: readonly number[], period: number): Promise<readonly number[]> {
  return replaceEmptyItemWithNaN(await ta.stochrsi(clone(source), period));
}

/** Bollinger Band
 *  @param source     Series of values to process
 *  @param period     Number of bars
 *  @param stddev     Standard deviation factor
 */
export async function bb(
  source: readonly number[],
  period: number,
  stddev: number,
): Promise<DeepReadonly<{ upper: number[]; middle: number[]; lower: number[] }>> {
  const [lower, middle, upper] = await ta.bbands(clone(source), period, stddev);
  return {
    lower: replaceEmptyItemWithNaN(lower),
    middle: replaceEmptyItemWithNaN(middle),
    upper: replaceEmptyItemWithNaN(upper),
  };
}

/** Bollinger Bands Width
 *  @param bb     Bollinger Band values
 */
export function bbw(
  bb: DeepReadonly<{ upper: number[]; middle: number[]; lower: number[] }>,
): readonly number[] {
  return transpose([clone(bb.upper), clone(bb.middle), clone(bb.lower)]).map(([upper, middle, lower]) => {
    return new Decimal(upper).minus(lower).dividedBy(middle).toNumber();
  });
}

/** Keltner Channel
 *  @param klines     Series of klines (candlesticks)
 *  @param period     Number of bars
 *  @param stddev     Standard deviation factor
 */
export async function kc(
  klines: readonly Kline[],
  period: number,
  stddev: number,
): Promise<DeepReadonly<{ upper: number[]; middle: number[]; lower: number[] }>> {
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
  return {
    lower: replaceEmptyItemWithNaN(lower),
    middle: replaceEmptyItemWithNaN(middle),
    upper: replaceEmptyItemWithNaN(upper),
  };
}

/** Average True Range
 *  @param klines     Series of klines (candlesticks)
 *  @param period     Number of bars
 */
export async function atr(klines: readonly Kline[], period: number): Promise<readonly number[]> {
  return replaceEmptyItemWithNaN(
    await ta.atr(klines.map(prop('high')), klines.map(prop('low')), klines.map(prop('close')), period),
  );
}

function replaceEmptyItemWithNaN<T>(arr: readonly T[]): readonly T[] {
  return Array.from(arr, (item) => item || NaN) as readonly T[];
}
