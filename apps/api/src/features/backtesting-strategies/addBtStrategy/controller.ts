import { FastifyReply, RouteHandlerMethod } from 'fastify';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { exchangeNameSchema } from '#features/shared/domain/exchangeName.js';
import { languageSchema } from '#features/shared/domain/language.js';
import { timeframeSchema } from '#features/shared/domain/timeframe.js';
import { executeT } from '#shared/utils/fp.js';
import { validateWithZod } from '#shared/utils/zod.js';
import { dateFromStringDate, nonEmptyString, nonNegativeFloat8Digits } from '#shared/utils/zod.schema.js';

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
              { type: 'SymbolNotExist' },
              { type: 'CreateBtStrategyModelError' },
              (error) => reply.code(400).send({ error }),
            )
            .with({ type: 'ExistByNameAndExchangeFailed' }, { type: 'AddFailed' }, (error) =>
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
      name: nonEmptyString,
      exchange: exchangeNameSchema,
      symbol: nonEmptyString,
      currency: nonEmptyString,
      timeframe: timeframeSchema,
      maxNumKlines: z.number().positive().int(),
      initialCapital: nonNegativeFloat8Digits,
      takerFeeRate: nonNegativeFloat8Digits,
      makerFeeRate: nonNegativeFloat8Digits,
      startTimestamp: dateFromStringDate,
      endTimestamp: dateFromStringDate,
      language: languageSchema,
      body: nonEmptyString,
    })
    .strict();

  return validateWithZod(requestBodySchema, 'Request body is invalid', body);
}
