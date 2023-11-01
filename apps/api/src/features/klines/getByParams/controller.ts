import { FastifyReply, RouteHandlerMethod } from 'fastify';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { match } from 'ts-pattern';
import { z } from 'zod';

import { ExchangeName } from '#SECT/Exchange.js';
import { Timeframe } from '#SECT/Kline.js';
import { exchangeNameSchema } from '#features/shared/exchange.js';
import { DateRange, dateRangeSchema } from '#features/shared/objectValues/dateRange.js';
import { timeframeSchema } from '#features/shared/timeframe.js';
import { validDateSchema } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';
import { isoUtcDateStringSchema } from '#shared/utils/string.js';
import { SchemaValidationError, validateWithZod } from '#shared/utils/zod.js';

export function buildGetKlinesByParamsController(): RouteHandlerMethod {
  return async function getKlinesByParamsController({ params }, reply): Promise<FastifyReply> {
    return pipe(
      te.fromEither(validateRequestParams(params)),
      te.match(
        (error) =>
          match(error)
            .returnType<FastifyReply>()
            .with({ name: 'SchemaValidationError' }, (error) => reply.code(400).send({ error }))
            .exhaustive(),
        () => reply.code(200).send([]),
      ),
      executeT,
    );
  };
}

type RequestParams = { exchange: ExchangeName; symbol: string; timeframe: Timeframe; dateRange: DateRange };
function validateRequestParams(params: unknown): e.Either<SchemaValidationError, RequestParams> {
  const paramsSchema = z
    .object({
      exchange: exchangeNameSchema,
      symbol: z.string().trim().min(1),
      timeframe: timeframeSchema,
      startTimestamp: isoUtcDateStringSchema.pipe(z.coerce.date()).pipe(validDateSchema),
      endTimestamp: isoUtcDateStringSchema.pipe(z.coerce.date()).pipe(validDateSchema),
    })
    .transform(({ exchange, symbol, timeframe, startTimestamp, endTimestamp }, ctx) => {
      const dateRange = dateRangeSchema.safeParse({ start: startTimestamp, end: endTimestamp });

      if (dateRange.success) {
        return { exchange, symbol, timeframe, dateRange: dateRange.data };
      } else {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dateRange'],
          message: 'Given date range is invalid',
        });
        return z.NEVER;
      }
    });
  const errorMessage = 'Request params is invalid';

  return validateWithZod(paramsSchema, errorMessage, params);
}
