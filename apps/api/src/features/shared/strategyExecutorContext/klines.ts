import { utcToZonedTime } from 'date-fns-tz';
import { ReadonlyNonEmptyArray, last } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';
import { prop } from 'ramda';

import type { KlinesModule } from '#SECT/KlinesModule.js';
import { ValidDate } from '#shared/utils/date.js';
import { TimezoneString } from '#shared/utils/string.js';

import { Kline } from '../kline.js';

export type { KlinesModule } from '#SECT/KlinesModule.js';

export function buildKlinesModule(
  klines: ReadonlyNonEmptyArray<Kline>,
  timezone: TimezoneString,
): KlinesModule {
  const currentKline = last(klines);

  return {
    openTimestamp: utcToZonedTime(currentKline.openTimestamp, timezone) as ValidDate,
    closeTimestamp: utcToZonedTime(currentKline.closeTimestamp, timezone) as ValidDate,
    open: currentKline.open,
    close: currentKline.close,
    high: currentKline.high,
    low: currentKline.low,
    volume: currentKline.volume,
    quoteAssetVolume: currentKline.quoteAssetVolume,
    takerBuyBaseAssetVolume: currentKline.takerBuyBaseAssetVolume,
    takerBuyQuoteAssetVolume: currentKline.takerBuyQuoteAssetVolume,
    numTrades: currentKline.numTrades,
    raw: currentKline,
    getAllOpen: () => klines.map(prop('open')),
    getAllClose: () => klines.map(prop('close')),
    getAllHigh: () => klines.map(prop('high')),
    getAllLow: () => klines.map(prop('low')),
    getAllVolume: () => klines.map(prop('volume')),
    getAllQuoteAssetVolume: () => klines.map(prop('quoteAssetVolume')),
    getAllTakerBuyBaseAssetVolume: () => klines.map(prop('takerBuyBaseAssetVolume')),
    getAllTakerBuyQuoteAssetVolume: () => klines.map(prop('takerBuyQuoteAssetVolume')),
    getAllNumTrades: () => klines.map(prop('numTrades')),
    getAllRaw: () => klines,
  };
}
