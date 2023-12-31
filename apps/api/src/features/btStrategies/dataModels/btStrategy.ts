import { isBefore, isEqual, subDays, subHours, subMinutes, subMonths, subSeconds, subWeeks } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import { pipe } from 'fp-ts/lib/function.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';

import { ExchangeName } from '#features/shared/exchange.js';
import {
  AssetCurrency,
  CapitalCurrency,
  InitialCapital,
  Language,
  MakerFeeRate,
  TakerFeeRate,
  initialCapitalSchema,
  makerFeeRateSchema,
  strategyBodySchema,
  strategyNameSchema,
  takerFeeRateSchema,
} from '#features/shared/strategy.js';
import { Symbol, SymbolName } from '#features/shared/symbol.js';
import { Timeframe } from '#features/shared/timeframe.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { ValidDate, isBeforeOrEqual, validDateSchema } from '#shared/utils/date.js';
import { TimezoneString, nonEmptyStringSchema } from '#shared/utils/string.js';
import { validateWithZod } from '#shared/utils/zod.js';

export type BtStrategyModel = Readonly<{
  id: BtStrategyId;
  name: BtStrategyName;
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  initialCapital: InitialCapital;
  assetCurrency: AssetCurrency;
  capitalCurrency: CapitalCurrency;
  takerFeeRate: TakerFeeRate;
  makerFeeRate: MakerFeeRate;
  maxNumKlines: MaxNumKlines;
  startTimestamp: BtStartTimestamp;
  endTimestamp: BtEndTimestamp;
  timezone: TimezoneString;
  language: Language;
  body: BtBody;
  version: number;
  createdAt: ValidDate;
  updatedAt: ValidDate;
}>;

export type BtStrategyId = z.infer<typeof btIdSchema>;
const btIdSchema = nonEmptyStringSchema.brand('BtStrategyId');

export type BtStrategyName = z.infer<typeof btNameSchema>;
const btNameSchema = strategyNameSchema.brand('BtStrategyName');

export type MaxNumKlines = z.infer<typeof maxNumKlinesSchema>;
const maxNumKlinesSchema = z.number().positive().int().brand('MaxNumKlines');

export type BtStartTimestamp = z.infer<typeof btStartTimestampSchema>;
const btStartTimestampSchema = validDateSchema.brand('BtStartTimestamp');

export type BtEndTimestamp = z.infer<typeof btEndTimestampSchema>;
const btEndTimestampSchema = validDateSchema.brand('BtStartTimestamp');

export type BtBody = z.infer<typeof btBodySchema>;
const btBodySchema = strategyBodySchema.brand('BtBody');

export const generateBtStrategyModelId: io.IO<BtStrategyId> = () => nanoid() as BtStrategyId;

export function createBtStrategyModel(
  data: {
    id: BtStrategyId;
    name: string;
    exchange: ExchangeName;
    symbol: SymbolName;
    timeframe: Timeframe;
    initialCapital: number;
    assetCurrency: AssetCurrency;
    capitalCurrency: CapitalCurrency;
    takerFeeRate: number;
    makerFeeRate: number;
    maxNumKlines: number;
    startTimestamp: ValidDate;
    endTimestamp: ValidDate;
    timezone: TimezoneString;
    language: Language;
    body: string;
  },
  currentDate: Date,
): e.Either<GeneralError<'CreateBtStrategyModelError'>, BtStrategyModel> {
  const btStrategyModelSchema = z
    .object({
      id: btIdSchema,
      name: btNameSchema,
      exchange: z.any(),
      symbol: z.any(),
      timeframe: z.any(),
      initialCapital: initialCapitalSchema,
      assetCurrency: z.any(),
      capitalCurrency: z.any(),
      takerFeeRate: takerFeeRateSchema,
      makerFeeRate: makerFeeRateSchema,
      maxNumKlines: maxNumKlinesSchema,
      startTimestamp: btStartTimestampSchema.refine(
        (startTimestamp) => isBefore(startTimestamp, currentDate),
        'Start timestamp must be in the past',
      ),
      endTimestamp: btEndTimestampSchema.refine(
        (endTimestamp) => isBefore(endTimestamp, currentDate),
        'End timestamp must be in the past',
      ),
      timezone: z.any(),
      language: z.any(),
      body: btBodySchema,
      version: z.number().nonnegative().int(),
      createdAt: validDateSchema,
      updatedAt: validDateSchema,
    })
    .strict()
    .refine(
      ({ startTimestamp, endTimestamp }) => isBeforeOrEqual(startTimestamp, endTimestamp),
      ({ startTimestamp, endTimestamp }) => ({
        message: `end timestamp (${endTimestamp.toISOString()}) must be after or equal to start timestamp (${startTimestamp.toISOString()})`,
        path: ['endTimestamp'],
      }),
    )
    .refine(
      ({ createdAt, updatedAt }) => isEqual(createdAt, updatedAt) || isBefore(createdAt, updatedAt),
      ({ createdAt, updatedAt }) => ({
        message: `updatedAt timestamp (${updatedAt.toISOString()}) must be equal or after createdAt timestamp (${createdAt.toISOString()})`,
        path: ['updatedAt'],
      }),
    );

  return pipe(
    validateWithZod(btStrategyModelSchema, 'Validating backtesting strategy schema failed', {
      ...data,
      version: 0,
      createdAt: currentDate,
      updatedAt: currentDate,
    }),
    e.bimap(
      (error) =>
        createGeneralError(
          'CreateBtStrategyModelError',
          'Creating a new backtesting strategy model failed because the given data is invalid',
          error,
        ),
      (btStrategy) => btStrategy as BtStrategyModel,
    ),
  );
}

export function validateBtStrategyCurrencies(
  symbol: Symbol,
  assetCurrency: string,
  capitalCurrency: string,
): e.Either<
  GeneralError<'InvalidCurrency'>,
  { assetCurrency: AssetCurrency; capitalCurrency: CapitalCurrency }
> {
  return (capitalCurrency === symbol.baseAsset && assetCurrency === symbol.quoteAsset) ||
    (capitalCurrency === symbol.quoteAsset && assetCurrency === symbol.baseAsset)
    ? e.right({
        symbol: symbol.name,
        capitalCurrency: capitalCurrency as CapitalCurrency,
        assetCurrency: assetCurrency as AssetCurrency,
      })
    : e.left(
        createGeneralError(
          'InvalidCurrency',
          `Currency of strategy must be either base asset (${symbol.baseAsset}) or quote asset (${symbol.quoteAsset}) of symbol`,
        ),
      );
}

export function extendBtRange(
  startTimestamp: BtStartTimestamp,
  timeframe: Timeframe,
  maxNumKlines: MaxNumKlines,
): ValidDate {
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

  return options[timeframe].subFn(startTimestamp, maxNumKlines * options[timeframe].multiplier) as ValidDate;
}
