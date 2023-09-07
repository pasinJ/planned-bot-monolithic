import { FastifyReply, RouteHandlerMethod } from 'fastify';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { exchangeNameSchema } from '#features/exchanges/domain/exchange.js';
import { DateService } from '#infra/services/date.type.js';
import { IdService } from '#infra/services/id.type.js';
import { nonEmptyString, nonNegativeFloat8Digits, stringDatetimeToDate } from '#shared/common.type.js';
import { languageSchema } from '#shared/domain/language.js';
import { timeframeSchema } from '#shared/domain/timeframe.js';
import { executeT } from '#shared/utils/fp.js';
import { parseWithZod } from '#shared/utils/zod.js';

import { BtStrategyRepo } from '../repositories/btStrategy.type.js';
import { addBtStrategyUseCase } from '../use-cases/addBtStrategy.js';

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

export type AddBtStrategyControllerDeps = {
  btStrategyRepo: BtStrategyRepo;
  dateService: DateService;
  idService: IdService;
};
export function buildAddBtStrategyController(deps: AddBtStrategyControllerDeps): RouteHandlerMethod {
  return function addBtStrategyController({ body }, reply): Promise<FastifyReply> {
    const pipeline = pipe(
      te.fromEither(parseWithZod(requestBodySchema, 'Request body is invalid', body)),
      te.chainW((parsedBody) => addBtStrategyUseCase(deps, parsedBody)),
      te.match(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with({ name: 'SchemaValidationError' }, { type: 'CreateBtStrategyError' }, (error) =>
              reply.code(400).send(error),
            )
            .with({ type: 'AddBtStrategyError' }, (error) => reply.code(500).send(error))
            .exhaustive(),
        () => reply.code(201).send(),
      ),
    );

    return executeT(pipeline);
  };
}
