import { isBefore, isEqual } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { z } from 'zod';

import { ExchangeName } from '#features/shared/domain/exchange.js';
import { Language } from '#features/shared/domain/strategy.js';
import { Timeframe } from '#features/shared/domain/timeframe.js';
import { AssetName, SymbolName } from '#features/symbols/dataModels/symbol.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { ValidDate, validDateSchema } from '#shared/utils/date.js';
import { nonNegativeFloat8DigitsSchema, nonNegativePercentage8DigitsSchema } from '#shared/utils/number.js';
import { nonEmptyStringSchema } from '#shared/utils/string.js';
import { validateWithZod } from '#shared/utils/zod.js';

export type BtStrategyModel = Readonly<{
  id: BtStrategyId;
  name: BtStrategyName;
  exchange: ExchangeName;
  symbol: SymbolName;
  currency: AssetName;
  timeframe: Timeframe;
  initialCapital: InitialCapital;
  takerFeeRate: TakerFeeRate;
  makerFeeRate: MakerFeeRate;
  maxNumKlines: MaxNumKlines;
  startTimestamp: BtStartTimestamp;
  endTimestamp: BtEndTimestamp;
  language: Language;
  body: BtBody;
  version: number;
  createdAt: ValidDate;
  updatedAt: ValidDate;
}>;

export type BtStrategyId = z.infer<typeof btIdSchema>;
const btIdSchema = nonEmptyStringSchema.brand('BtStrategyId');

export type BtStrategyName = z.infer<typeof btNameSchema>;
const btNameSchema = nonEmptyStringSchema.brand('BtStrategyName');

export type InitialCapital = z.infer<typeof initialCapitalSchema>;
const initialCapitalSchema = nonNegativeFloat8DigitsSchema.brand('InitialCapital');

export type FeeRate = z.infer<typeof feeRateSchema>;
const feeRateSchema = nonNegativePercentage8DigitsSchema.brand('FeeRate');

export type TakerFeeRate = z.infer<typeof takerFeeRateSchema>;
const takerFeeRateSchema = feeRateSchema.brand('TakerFeeRate');

export type MakerFeeRate = z.infer<typeof makerFeeRateSchema>;
const makerFeeRateSchema = feeRateSchema.brand('MakerFeeRate');

export type MaxNumKlines = z.infer<typeof maxNumKlinesSchema>;
const maxNumKlinesSchema = z.number().positive().int().brand('MaxNumKlines');

export type BtStartTimestamp = z.infer<typeof btStartTimestampSchema>;
const btStartTimestampSchema = validDateSchema.brand('BtStartTimestamp');

export type BtEndTimestamp = z.infer<typeof btEndTimestampSchema>;
const btEndTimestampSchema = validDateSchema.brand('BtStartTimestamp');

export type BtBody = z.infer<typeof btBodySchema>;
const btBodySchema = nonEmptyStringSchema.brand('BtBody');

export function createBtStrategyModel(
  data: {
    id: string;
    name: string;
    exchange: ExchangeName;
    symbol: SymbolName;
    currency: AssetName;
    timeframe: Timeframe;
    initialCapital: number;
    takerFeeRate: number;
    makerFeeRate: number;
    maxNumKlines: number;
    startTimestamp: ValidDate;
    endTimestamp: ValidDate;
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
      currency: z.any(),
      timeframe: z.any(),
      initialCapital: initialCapitalSchema,
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
      language: z.any(),
      body: btBodySchema,
      version: z.number().nonnegative().int(),
      createdAt: validDateSchema,
      updatedAt: validDateSchema,
    })
    .strict()
    .refine(
      ({ startTimestamp, endTimestamp }) => isBefore(startTimestamp, endTimestamp),
      ({ startTimestamp, endTimestamp }) => ({
        message: `end timestamp (${endTimestamp.toISOString()}) must be after start timestamp (${startTimestamp.toISOString()})`,
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
