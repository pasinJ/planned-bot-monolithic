import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { ExchangeName, exchangeNameSchema } from '#features/exchanges/exchange';
import { Timeframe, timeframeSchema } from '#features/klines/kline';
import { SymbolName, symbolNameSchema } from '#features/symbols/symbol';
import { ValidDate, validDateSchema } from '#shared/utils/date';
import { TimezoneString, timezoneStringSchema } from '#shared/utils/string';
import { schemaForType } from '#shared/utils/zod';

export type BtStrategyId = string & z.BRAND<'BtStrategyId'>;
export const btStrategyIdSchema = schemaForType<BtStrategyId>().with(z.string().brand('BtStrategyId'));

export type BtStrategyName = string & z.BRAND<'BtStrategyName'>;
const btStrategyNameSchema = schemaForType<BtStrategyName>().with(z.string().brand('BtStrategyName'));

export type InitialCapital = number & z.BRAND<'InitialCapital'>;
const initialCapitalSchema = schemaForType<InitialCapital>().with(z.number().brand('InitialCapital'));

export type CapitalCurrency = string & z.BRAND<'CapitalCurrency'>;
const capitalCurrencySchema = schemaForType<CapitalCurrency>().with(z.string().brand('CapitalCurrency'));

export type TakerFeeRate = number & z.BRAND<'TakerFeeRate'>;
const takerFeeRateSchema = schemaForType<TakerFeeRate>().with(z.number().brand('TakerFeeRate'));

export type MakerFeeRate = number & z.BRAND<'MakerFeeRate'>;
const makerFeeRateSchema = schemaForType<MakerFeeRate>().with(z.number().brand('MakerFeeRate'));

export type MaxNumKlines = number & z.BRAND<'MaxNumKlines'>;
const maxNumKlinesSchema = schemaForType<MaxNumKlines>().with(z.number().brand('MaxNumKlines'));

export type BtStartTimestamp = ValidDate & z.BRAND<'BtStartTimestamp'>;
const btStartTimestampSchema = schemaForType<BtStartTimestamp>().with(
  validDateSchema.brand('BtStartTimestamp'),
);

export type BtEndTimestamp = ValidDate & z.BRAND<'BtEndTimestamp'>;
const btEndTimestampSchema = schemaForType<BtEndTimestamp>().with(validDateSchema.brand('BtEndTimestamp'));

export type StrategyLanguage = z.infer<typeof strategyLanguageSchama>;
export const strategyLanguageSchama = z.enum(['javascript', 'typescript']);
export const strategyLanguageEnum = strategyLanguageSchama.enum;
export const strategyLanguageOptions = strategyLanguageSchama.options;

export type BtStrategyBody = string & z.BRAND<'BtStrategyBody'>;
export const btStrategyBodySchema = schemaForType<BtStrategyBody>().with(z.string().brand('BtStrategyBody'));

export type BtStrategy = DeepReadonly<{
  id: BtStrategyId;
  name: BtStrategyName;
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  initialCapital: InitialCapital;
  capitalCurrency: CapitalCurrency;
  takerFeeRate: TakerFeeRate;
  makerFeeRate: MakerFeeRate;
  maxNumKlines: MaxNumKlines;
  startTimestamp: BtStartTimestamp;
  endTimestamp: BtEndTimestamp;
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
      takerFeeRate: takerFeeRateSchema,
      makerFeeRate: makerFeeRateSchema,
      maxNumKlines: maxNumKlinesSchema,
      startTimestamp: btStartTimestampSchema,
      endTimestamp: btEndTimestampSchema,
      timezone: timezoneStringSchema,
      language: strategyLanguageSchama,
      body: btStrategyBodySchema,
      version: z.number().nonnegative().int(),
      createdAt: validDateSchema,
      updatedAt: validDateSchema,
    })
    .readonly(),
);
