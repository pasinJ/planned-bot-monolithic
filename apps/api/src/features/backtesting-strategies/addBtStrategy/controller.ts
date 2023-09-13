import { FastifyReply, RouteHandlerMethod } from 'fastify';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { exchangeNameSchema } from '#features/exchanges/domain/exchange.js';
import { DateService } from '#infra/services/date/service.type.js';
import { languageSchema } from '#shared/domain/language.js';
import { timeframeSchema } from '#shared/domain/timeframe.js';
import { executeT } from '#shared/utils/fp.js';
import { parseWithZod } from '#shared/utils/zod.js';
import { nonEmptyString, nonNegativeFloat8Digits, stringDatetimeToDate } from '#shared/utils/zod.schema.js';

import { BtStrategyModelDao } from '../data-models/btStrategy.dao.type.js';
import { addBtStrategy } from './useCase.js';

export type AddBtStrategyControllerDeps = {
  btStrategyModelDao: Pick<BtStrategyModelDao, 'generateId' | 'add'>;
  dateService: Pick<DateService, 'getCurrentDate'>;
};

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
    startTimestamp: stringDatetimeToDate,
    endTimestamp: stringDatetimeToDate,
    language: languageSchema,
    body: nonEmptyString,
  })
  .strict();

export function buildAddBtStrategyController(deps: AddBtStrategyControllerDeps): RouteHandlerMethod {
  return function addBtStrategyController({ body }, reply): Promise<FastifyReply> {
    const pipeline = pipe(
      te.fromEither(parseWithZod(requestBodySchema, 'Request body is invalid', body)),
      te.chainW((parsedBody) => addBtStrategy(deps, parsedBody)),
      te.match(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with({ name: 'SchemaValidationError' }, { type: 'CreateBtStrategyError' }, (error) =>
              reply.code(400).send(error),
            )
            .with({ type: 'AddFailed' }, (error) => reply.code(500).send(error))
            .exhaustive(),
        (result) => reply.code(201).send(result),
      ),
    );

    return executeT(pipeline);
  };
}
