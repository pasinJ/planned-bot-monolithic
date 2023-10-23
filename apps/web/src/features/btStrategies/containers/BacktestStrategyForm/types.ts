import { BtStrategyBody, StrategyLanguage } from '#features/btStrategies/btStrategy';
import { ExchangeName } from '#features/exchanges/exchange';
import { Timeframe } from '#features/klines/kline';
import { BaseAsset, QuoteAsset, SymbolName } from '#features/symbols/symbol';
import { ValidDate } from '#shared/utils/date';
import { DecimalString, IntegerString } from '#shared/utils/string';

export type BacktestForm = {
  name: string;
  exchange: ExchangeName;
  timeframe: Timeframe;
  maxNumKlines: IntegerString;
  startTimestamp: ValidDate;
  endTimestamp: ValidDate;
  initialCapital: DecimalString;
  takerFeeRate: DecimalString;
  makerFeeRate: DecimalString;
  language: StrategyLanguage;
  body: BtStrategyBody;
} & (
  | { symbol: null; capitalCurrency: null }
  | { symbol: SymbolName; capitalCurrency: BaseAsset | QuoteAsset }
);
