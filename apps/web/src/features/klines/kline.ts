import { z } from 'zod';

import { ExchangeName } from '#features/exchanges/domain/exchange.js';
import { SymbolName } from '#features/symbols/domain/symbol.valueObject.js';
import { ValidDate } from '#shared/utils/date';

export type Kline = Readonly<{
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  openTimestamp: ValidDate;
  closeTimestamp: ValidDate;
  open: Price;
  high: Price;
  low: Price;
  close: Price;
  volume: Volume;
  quoteAssetVolume: Volume;
  takerBuyBaseAssetVolume: Volume;
  takerBuyQuoteAssetVolume: Volume;
  numTrades: NumTrades;
}>;

export type Price = number & z.BRAND<'Price'>;
export type Volume = number & z.BRAND<'Volume'>;
export type NumTrades = number & z.BRAND<'NumTrades'>;
export type Timeframe =
  | '1s'
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '8h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1M';
