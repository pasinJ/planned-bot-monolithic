import { FastifyReply, RouteHandlerMethod } from 'fastify';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { exchangeNameSchema } from '#features/shared/domain/exchange.js';
import { languageSchema } from '#features/shared/domain/strategy.js';
import { timeframeSchema } from '#features/shared/domain/timeframe.js';
import { validDateSchema } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';
import { isoUtcDateStringSchema, timezoneStringSchema } from '#shared/utils/string.js';
import { validateWithZod } from '#shared/utils/zod.js';

import { AddBtStrategyDeps, addBtStrategy } from './useCase.js';

export type AddBtStrategyControllerDeps = AddBtStrategyDeps;

export function buildAddBtStrategyController(deps: AddBtStrategyControllerDeps): RouteHandlerMethod {
  return function addBtStrategyController({ body }, reply): Promise<FastifyReply> {
    return pipe(
      te.fromEither(validateRequestBody(body)),
      te.chainW((parsedBody) => addBtStrategy(deps, parsedBody)),
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

function validateRequestBody(body: unknown) {
  const requestBodySchema = z
    .object({
      name: z.string(),
      exchange: exchangeNameSchema,
      symbol: z.string(),
      currency: z.string(),
      timeframe: timeframeSchema,
      maxNumKlines: z.number(),
      initialCapital: z.number(),
      takerFeeRate: z.number(),
      makerFeeRate: z.number(),
      startTimestamp: isoUtcDateStringSchema.pipe(z.coerce.date()).pipe(validDateSchema),
      endTimestamp: isoUtcDateStringSchema.pipe(z.coerce.date()).pipe(validDateSchema),
      timezone: timezoneStringSchema,
      language: languageSchema,
      body: z.string(),
    })
    .strict();

  return validateWithZod(requestBodySchema, 'Request body is invalid', body);
}
