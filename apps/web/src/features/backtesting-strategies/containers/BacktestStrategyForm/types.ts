import { StrategyBody, StrategyLanguage } from '#features/backtesting-strategies/domain/btStrategy.entity';
import { ExchangeName } from '#features/exchanges/domain/exchange';
import { BaseAsset, QuoteAsset, SymbolName } from '#features/symbols/symbol';
import { Timeframe } from '#shared/domain/timeframe';
import { ValidDate } from '#shared/utils/date';
import { DecimalString, IntegerString } from '#shared/utils/string';

export type BacktestForm = {
  name: string;
  exchange: ExchangeName;
  symbol: SymbolName | null;
  timeframe: Timeframe;
  maxNumKlines: IntegerString;
  startTimestamp: ValidDate;
  endTimestamp: ValidDate;
  capitalCurrency: BaseAsset | QuoteAsset | null;
  initialCapital: DecimalString;
  takerFeeRate: DecimalString;
  makerFeeRate: DecimalString;
  language: StrategyLanguage;
  body: StrategyBody;
} & (
  | { symbol: null; capitalCurrency: null }
  | { symbol: SymbolName; capitalCurrency: BaseAsset | QuoteAsset }
);
