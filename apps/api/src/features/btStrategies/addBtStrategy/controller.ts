import { FastifyReply, RouteHandlerMethod } from 'fastify';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { ValidDate } from '#SECT/date.js';
import { ExchangeName, exchangeNameSchema } from '#features/shared/exchange.js';
import { Language, languageSchema } from '#features/shared/strategy.js';
import { Timeframe, timeframeSchema } from '#features/shared/timeframe.js';
import { validDateSchema } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';
import { TimezoneString, isoUtcDateStringSchema, timezoneStringSchema } from '#shared/utils/string.js';
import { SchemaValidationError, validateWithZod } from '#shared/utils/zod.js';

import { AddBtStrategyDeps, addBtStrategy } from './useCase.js';

export type AddBtStrategyControllerDeps = AddBtStrategyDeps;

export function buildAddBtStrategyController(deps: AddBtStrategyControllerDeps): RouteHandlerMethod {
  return function addBtStrategyController({ body }, reply): Promise<FastifyReply> {
    return pipe(
      te.fromEither(validateRequestBody(body)),
      te.chainW(({ btRange, ...rest }) =>
        addBtStrategy(deps, { ...rest, startTimestamp: btRange.start, endTimestamp: btRange.end }),
      ),
      te.match(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with(
              { name: 'SchemaValidationError' },
              { type: 'NotExist' },
              { type: 'InvalidCurrency' },
              { type: 'CreateBtStrategyModelError' },
              (error) => reply.code(400).send({ error }),
            )
            .with({ type: 'GetByNameAndExchangeFailed' }, { type: 'AddFailed' }, (error) =>
              reply.code(500).send({ error }),
            )
            .exhaustive(),
        (result) => reply.code(201).send(result),
      ),
      executeT,
    );
  };
}

type RequestBody = {
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
};
function validateRequestBody(body: unknown): e.Either<SchemaValidationError, RequestBody> {
  const requestBodySchema = z
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

  return validateWithZod(requestBodySchema, 'Request body is invalid', body);
}
