import {
  isAfter,
  isBefore,
  isFuture,
  subDays,
  subHours,
  subMinutes,
  subMonths,
  subSeconds,
  subWeeks,
} from 'date-fns';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { ExchangeName, exchangeNameSchema } from '#features/exchanges/exchange';
import { Timeframe, timeframeSchema } from '#features/klines/kline';
import {
  BaseAsset,
  QuoteAsset,
  Symbol,
  SymbolName,
  baseAssetSchema,
  quoteAssetschema,
  symbolNameSchema,
} from '#features/symbols/symbol';
import { DateRange, ValidDate, validDateSchema } from '#shared/utils/date';
import { TimezoneString, timezoneStringSchema } from '#shared/utils/string';
import { schemaForType } from '#shared/utils/zod';

export type BtStrategyId = string & z.BRAND<'BtStrategyId'>;
export const btStrategyIdSchema = schemaForType<BtStrategyId>().with(z.string().brand('BtStrategyId'));

export type BtStrategyName = string & z.BRAND<'BtStrategyName'>;
export const btStrategyNameSchema = schemaForType<BtStrategyName>().with(
  z.string().trim().min(1, "Strategy name must't be empty").brand('BtStrategyName'),
);

export type InitialCapital = number & z.BRAND<'InitialCapital'>;
export const initialCapitalSchema = schemaForType<InitialCapital>().with(
  z.number().positive('Initial capital must be greater than 0').brand('InitialCapital'),
);

export type CapitalCurrency = (BaseAsset | QuoteAsset) & z.BRAND<'CapitalCurrency'>;
export const capitalCurrencySchema = schemaForType<CapitalCurrency>().with(
  z.union([baseAssetSchema, quoteAssetschema]).brand('CapitalCurrency'),
);
export type AssetCurrency = (BaseAsset | QuoteAsset) & z.BRAND<'AssetCurrency'>;
export const assetCurrencySchema = schemaForType<AssetCurrency>().with(
  z.union([baseAssetSchema, quoteAssetschema]).brand('AssetCurrency'),
);

export type TakerFeeRate = number & z.BRAND<'TakerFeeRate'>;
export const takerFeeRateSchema = schemaForType<TakerFeeRate>().with(
  z
    .number()
    .nonnegative('Taker fee rate must be greater than or equal to 0')
    .max(100, 'Taker fee rate must be between 0 to 100')
    .brand('TakerFeeRate'),
);

export type MakerFeeRate = number & z.BRAND<'MakerFeeRate'>;
export const makerFeeRateSchema = schemaForType<MakerFeeRate>().with(
  z
    .number()
    .nonnegative('Maker fee rate must be greater than or equal to 0')
    .max(100, 'Maker fee rate must be between 0 to 100')
    .brand('MakerFeeRate'),
);

export type MaxNumKlines = number & z.BRAND<'MaxNumKlines'>;
export const maxNumKlinesSchema = schemaForType<MaxNumKlines>().with(
  z.number().int().min(1, 'Maximum number of klines must be at least 1').brand('MaxNumKlines'),
);

export type BtRange = { start: BtStartTimestamp; end: BtEndTimestamp };
type BtStartTimestamp = ValidDate & z.BRAND<'BtStartTimestamp'>;
type BtEndTimestamp = ValidDate & z.BRAND<'BtEndTimestamp'>;
export const btRangeSchema = schemaForType<BtRange>().with(
  z
    .object({
      start: validDateSchema.brand('BtStartTimestamp'),
      end: validDateSchema.brand('BtEndTimestamp'),
    })
    .refine(({ start }) => !isFuture(start), {
      message: 'Start timestamp must not be in the future',
      path: ['start'],
    })
    .refine(({ start, end }) => !isAfter(start, end), {
      message: 'Start timestamp must not be after end timestamp',
      path: ['start'],
    })
    .refine(({ end }) => !isFuture(end), {
      message: 'End timestamp must not be in the future',
      path: ['end'],
    })
    .refine(({ start, end }) => !isBefore(end, start), {
      message: 'End timestamp must not be before end timestamp',
      path: ['end'],
    }),
);

export type StrategyLanguage = z.infer<typeof strategyLanguageSchama>;
export const strategyLanguageSchama = z.enum(['javascript', 'typescript']);
export const strategyLanguageEnum = strategyLanguageSchama.enum;
export const strategyLanguageOptions = strategyLanguageSchama.options;

export type BtStrategyBody = string & z.BRAND<'BtStrategyBody'>;
export const btStrategyBodySchema = schemaForType<BtStrategyBody>().with(
  z.string().trim().min(1, "Strategy body must't be empty").brand('BtStrategyBody'),
);

export type BtStrategy = DeepReadonly<{
  id: BtStrategyId;
  name: BtStrategyName;
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  initialCapital: InitialCapital;
  capitalCurrency: CapitalCurrency;
  assetCurrency: AssetCurrency;
  takerFeeRate: TakerFeeRate;
  makerFeeRate: MakerFeeRate;
  maxNumKlines: MaxNumKlines;
  btRange: BtRange;
  timezone: TimezoneString;
  language: StrategyLanguage;
  body: BtStrategyBody;
  version: number;
  createdAt: ValidDate;
  updatedAt: ValidDate;
}>;
export const btStrategySchema = schemaForType<BtStrategy>().with(
  z
    .object({
      id: btStrategyIdSchema,
      name: btStrategyNameSchema,
      exchange: exchangeNameSchema,
      symbol: symbolNameSchema,
      timeframe: timeframeSchema,
      initialCapital: initialCapitalSchema,
      capitalCurrency: capitalCurrencySchema,
      assetCurrency: assetCurrencySchema,
      takerFeeRate: takerFeeRateSchema,
      makerFeeRate: makerFeeRateSchema,
      maxNumKlines: maxNumKlinesSchema,
      btRange: btRangeSchema,
      timezone: timezoneStringSchema,
      language: strategyLanguageSchama,
      body: btStrategyBodySchema,
      version: z.number().nonnegative().int(),
      createdAt: validDateSchema,
      updatedAt: validDateSchema,
    })
    .readonly(),
);

export function getAssetCurrency(symbol: Symbol, capitalCurrency: CapitalCurrency): AssetCurrency {
  return (symbol.baseAsset === capitalCurrency ? symbol.quoteAsset : symbol.baseAsset) as AssetCurrency;
}

export function extendBtRange(btRange: BtRange, timeframe: Timeframe, maxNumKlines: MaxNumKlines): DateRange {
  const options = {
    '1s': { subFn: subSeconds, multiplier: 1 },
    '1m': { subFn: subMinutes, multiplier: 1 },
    '3m': { subFn: subMinutes, multiplier: 3 },
    '5m': { subFn: subMinutes, multiplier: 5 },
    '15m': { subFn: subMinutes, multiplier: 15 },
    '30m': { subFn: subMinutes, multiplier: 30 },
    '1h': { subFn: subHours, multiplier: 1 },
    '2h': { subFn: subHours, multiplier: 3 },
    '4h': { subFn: subHours, multiplier: 4 },
    '6h': { subFn: subHours, multiplier: 6 },
    '8h': { subFn: subHours, multiplier: 8 },
    '12h': { subFn: subHours, multiplier: 12 },
    '1d': { subFn: subDays, multiplier: 1 },
    '3d': { subFn: subDays, multiplier: 3 },
    '1w': { subFn: subWeeks, multiplier: 1 },
    '1M': { subFn: subMonths, multiplier: 1 },
  };

  return {
    start: options[timeframe].subFn(btRange.start, maxNumKlines * options[timeframe].multiplier) as ValidDate,
    end: btRange.end as ValidDate,
  } as DateRange;
}
