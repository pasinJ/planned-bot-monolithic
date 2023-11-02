import { FastifyReply, RouteHandlerMethod } from 'fastify';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { DeepReadonly } from 'ts-essentials';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { ExchangeName } from '#SECT/Exchange.js';
import { Timeframe } from '#SECT/Kline.js';
import { ValidDate } from '#SECT/date.js';
import { exchangeNameSchema } from '#features/shared/exchange.js';
import { Language, languageSchema } from '#features/shared/strategy.js';
import { timeframeSchema } from '#features/shared/timeframe.js';
import { validDateSchema } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';
import { TimezoneString, isoUtcDateStringSchema, timezoneStringSchema } from '#shared/utils/string.js';
import { SchemaValidationError, validateWithZod } from '#shared/utils/zod.js';

import updateBtStrategyUseCase, { UpdateBtStrategyUseCaseDeps } from './useCase.js';

export type UpdateBtStrategyControllerDeps = UpdateBtStrategyUseCaseDeps;

export function buildUpdateBtStrategyController(deps: UpdateBtStrategyControllerDeps): RouteHandlerMethod {
  return function updateBtStrategyController({ params, body }, reply): Promise<FastifyReply> {
    return pipe(
      te.Do,
      te.bindW('params', () => te.fromEither(validateReqParams(params))),
      te.bindW('body', () => te.fromEither(validateReqBody(body))),
      te.chainW(({ params, body }) => updateBtStrategyUseCase(deps, { id: params.btStrategyId, ...body })),
      te.match(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with(
              { name: 'SchemaValidationError' },
              { name: 'SymbolDaoError', type: 'NotExist' },
              { name: 'GeneralError', type: 'InvalidCurrency' },
              { name: 'GeneralError', type: 'CreateBtStrategyModelError' },
              (error) => reply.code(400).send({ error }),
            )
            .with({ name: 'BtStrategyDaoError', type: 'NotExist' }, (error) =>
              reply.code(404).send({ error }),
            )
            .with(
              { name: 'SymbolDaoError', type: 'GetByNameAndExchangeFailed' },
              { name: 'BtStrategyDaoError', type: 'UpdateByIdFailed' },
              (error) => reply.code(500).send({ error }),
            )
            .exhaustive(),
        (result) => reply.code(200).send(result),
      ),
      executeT,
    );
  };
}

type ReqParams = Readonly<{ btStrategyId: string }>;
function validateReqParams(params: unknown): e.Either<SchemaValidationError, ReqParams> {
  const errMsg = 'Request params is invalid';
  const reqBodySchema = z.object({ btStrategyId: z.string().trim().min(1) });

  return validateWithZod(reqBodySchema, errMsg, params);
}

type ReqBody = DeepReadonly<{
  name: string;
  exchange: ExchangeName;
  symbol: string;
  assetCurrency: string;
  capitalCurrency: string;
  timeframe: Timeframe;
  maxNumKlines: number;
  initialCapital: number;
  takerFeeRate: number;
  makerFeeRate: number;
  btRange: { start: ValidDate; end: ValidDate };
  timezone: TimezoneString;
  language: Language;
  body: string;
}>;
function validateReqBody(body: unknown): e.Either<SchemaValidationError, ReqBody> {
  const errMsg = 'Request body is invalid';
  const reqBodySchema = z
    .object({
      name: z.string(),
      exchange: exchangeNameSchema,
      symbol: z.string(),
      assetCurrency: z.string(),
      capitalCurrency: z.string(),
      timeframe: timeframeSchema,
      maxNumKlines: z.number(),
      initialCapital: z.number(),
      takerFeeRate: z.number(),
      makerFeeRate: z.number(),
      btRange: z.object({
        start: isoUtcDateStringSchema.pipe(z.coerce.date()).pipe(validDateSchema),
        end: isoUtcDateStringSchema.pipe(z.coerce.date()).pipe(validDateSchema),
      }),
      timezone: timezoneStringSchema,
      language: languageSchema,
      body: z.string(),
    })
    .strict();

  return validateWithZod(reqBodySchema, errMsg, body);
}
