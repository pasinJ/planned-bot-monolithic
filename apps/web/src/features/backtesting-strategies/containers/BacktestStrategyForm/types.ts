import { ExchangeName } from '#features/exchanges/domain/exchange';
import { SymbolName } from '#features/symbols/symbol';
import { Timeframe } from '#shared/domain/timeframe';
import { IntegerString } from '#shared/utils/string';

export type BacktestForm = {
  name: string;
  exchange: ExchangeName;
  symbol: SymbolName | null;
  timeframe: Timeframe;
  maxNumKlines: IntegerString;
};
