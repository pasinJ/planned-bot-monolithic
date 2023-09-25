import { utcToZonedTime } from 'date-fns-tz';
import { ReadonlyNonEmptyArray, last } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';
import { prop } from 'ramda';

import { KlineModel, NumTrades, Price, Volume } from '#features/btStrategies/dataModels/kline.js';
import { ValidDate } from '#shared/utils/date.js';
import { TimezoneString } from '#shared/utils/string.js';

export type KlinesModule = {
  /** Open timestamp of the current kline */
  openTimestamp: ValidDate;
  /** Close timestamp of the current kline */
  closeTimestamp: ValidDate;
  /** Open price of the current kline */
  open: Price;
  /** Close price of the current kline */
  close: Price;
  /** High price of the current kline */
  high: Price;
  /** Low price of the current kline */
  low: Price;
  /** Volume of the current kline */
  volume: Volume;
  /** Quote asset volume of the current kline */
  quoteAssetVolume: Volume;
  /** Taker buy base asset volume of the current kline */
  takerBuyBaseAssetVolume: Volume;
  /** Taker buy quote asset volume of the current kline */
  takerBuyQuoteAssetVolume: Volume;
  /** Number of trades of the current kline */
  numTrades: NumTrades;
  /** Kline model of the current kline */
  raw: KlineModel;
  /** Get array of open price from oldest to earliest order */
  getAllOpen: () => readonly Price[];
  /** Get array of high price from oldest to earliest order */
  getAllHigh: () => readonly Price[];
  /** Get array of low price from oldest to earliest order */
  getAllLow: () => readonly Price[];
  /** Get array of close price from oldest to earliest order */
  getAllClose: () => readonly Price[];
  /** Get array of volume from oldest to earliest order */
  getAllVolume: () => readonly Volume[];
  /** Get array of quote asset volume from oldest to earliest order */
  getAllQuoteAssetVolume: () => readonly Volume[];
  /** Get array of taker buy base asset volume from oldest to earliest order */
  getAllTakerBuyBaseAssetVolume: () => readonly Volume[];
  /** Get array of taker buy quote asset volume from oldest to earliest order */
  getAllTakerBuyQuoteAssetVolume: () => readonly Volume[];
  /** Get array of number of trades from oldest to earliest order */
  getAllNumTrades: () => readonly NumTrades[];
  /** Get array of kline models from oldest to earliest order */
  getAllRaw: () => readonly KlineModel[];
};

export function buildKlinesModule(
  klines: ReadonlyNonEmptyArray<KlineModel>,
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
