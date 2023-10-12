import { ExchangeName, exchangeNameEnum } from '#features/exchanges/domain/exchange';
import { Language } from '#shared/domain/language';
import { Timeframe } from '#shared/domain/timeframe';

export type AddBtStrategyFormValues = {
  name: string;
  exchange: ExchangeName;
  symbol: string | null;
  currency: string;
  timeframe: Timeframe | '';
  maxNumKlines: string;
  initialCapital: string;
  takerFeeRate: string;
  makerFeeRate: string;
  startTimestamp: Date;
  endTimestamp: Date;
  language: Language;
  body: string;
};
export const defaultValues: AddBtStrategyFormValues = {
  name: '',
  exchange: exchangeNameEnum.BINANCE,
  symbol: null,
  currency: '',
  timeframe: '',
  maxNumKlines: '100',
  initialCapital: '0',
  takerFeeRate: '0.0',
  makerFeeRate: '0.0',
  startTimestamp: new Date(),
  endTimestamp: new Date(),
  language: 'javascript',
  body: '',
};

export const timeframeOptions: Record<Timeframe, string> = {
  '1s': '1 second',
  '1m': '1 minute',
  '3m': '3 minutes',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '30m': '30 minutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '4h': '4 hours',
  '6h': '6 hours',
  '8h': '8 hours',
  '12h': '12 hours',
  '1d': '1 day',
  '3d': '3 days',
  '1w': '1 week',
  '1M': '1 month',
};

export const languageOptions: Language[] = ['javascript', 'typescript'];
