import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import t from 'fp-ts/lib/Task.js';
import te from 'fp-ts/lib/TaskEither.js';
import { flow, pipe } from 'fp-ts/lib/function.js';
import { Cursor, QueryOptions } from 'mongoose';
import { ascend, includes, isNotNil, mergeAll, omit, pathOr, prop, reject } from 'ramda';

import { ExchangeName } from '#features/shared/exchange.js';
import { Kline } from '#features/shared/kline.js';
import { SymbolName } from '#features/shared/symbol.js';
import { Timeframe } from '#features/shared/timeframe.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';
import { ValidDate } from '#shared/utils/date.js';
import { isUndefined } from '#shared/utils/general.js';

import { KlineDaoError, createKlineDaoError } from './kline.error.js';
import { KlineMongooseModel } from './kline.js';

export type AddKlines = (klines: Kline | readonly Kline[]) => te.TaskEither<AddKlinesError, void>;
export type AddKlinesError = KlineDaoError<'AddFailed'>;
export function addKlines({ mongooseModel }: { mongooseModel: KlineMongooseModel }): AddKlines {
  return (klines) =>
    pipe(
      te.tryCatch(
        () => mongooseModel.insertMany(klines, { ordered: false }),
        createErrorFromUnknown(createKlineDaoError('AddFailed', 'Adding new kline model(s) failed')),
      ),
      te.orElse((error) =>
        pipe(pathOr('', ['cause', 'message'], error), includes('duplicate key error'))
          ? te.right(undefined)
          : te.left(error),
      ),
      te.asUnit,
    );
}

export type IterateThroughKlines = <E>(
  filter: Partial<{
    exchange: ExchangeName;
    symbol: SymbolName;
    timeframe: Timeframe;
    start: ValidDate;
    end: ValidDate;
  }>,
  callbackFns?: {
    onEach?: (kline: Kline) => te.TaskEither<E, void>;
    onFinish?: io.IO<void>;
    onError?: (error: E | GetNextKlineIterationError) => io.IO<void>;
  },
) => ioe.IOEither<CreateKlinesIteratorError, void>;
export type CreateKlinesIteratorError = KlineDaoError<'CreateIteratorFailed'>;
export type GetNextKlineIterationError = KlineDaoError<'GetNextIterationFailed'>;
export function iterateThroughKlines({
  mongooseModel,
}: {
  mongooseModel: KlineMongooseModel;
}): IterateThroughKlines {
  return (
    filter,
    { onEach = () => te.right(undefined), onFinish = () => undefined, onError = () => () => undefined } = {},
  ) => {
    function cursorLoop(cursor: Cursor<Kline, QueryOptions>): t.Task<void> {
      return pipe(
        te.tryCatch(
          () => cursor.next(),
          createErrorFromUnknown(createKlineDaoError('GetNextIterationFailed', 'Cursor.next() return error')),
        ),
        te.chainW(
          flow(
            te.fromPredicate(isNotNil, () => onFinish()),
            te.chainW((kline) => onEach(kline)),
            te.chainTaskK(() => cursorLoop(cursor)),
            te.orElse((error) => (error ? te.left(error) : te.right(undefined))),
          ),
        ),
        te.orElse((error) => te.fromIO(onError(error))),
        te.toUnion,
      );
    }

    return pipe(
      ioe.tryCatch(
        () =>
          mongooseModel
            .find(
              mergeAll([
                filter.exchange ? { exchange: filter.exchange } : {},
                filter.symbol ? { symbol: filter.symbol } : {},
                filter.timeframe ? { timeframe: filter.timeframe } : {},
                filter.start ?? filter.end
                  ? { closeTimestamp: reject(isUndefined, { $gte: filter.start, $lte: filter.end }) }
                  : {},
              ]),
            )
            .sort({ closeTimestamp: 'asc' })
            .lean()
            .cursor({ batchSize: 100 })
            .map(omit(['_id', '__v'])),
        createErrorFromUnknown(
          createKlineDaoError('CreateIteratorFailed', 'Adding new kline model(s) failed'),
        ),
      ),
      ioe.chainFirstIOK((cursor) => cursorLoop(cursor)),
      ioe.asUnit,
    );
  };
}

export type GetKlinesBefore = (
  filter: { exchange: ExchangeName; symbol: string; timeframe: Timeframe; start: ValidDate },
  limit: number,
) => te.TaskEither<GetKlinesBeforeError, readonly Kline[]>;
export type GetKlinesBeforeError = KlineDaoError<'GetBeforeFailed'>;
export function getKlinesBefore({ mongooseModel }: { mongooseModel: KlineMongooseModel }): GetKlinesBefore {
  return (filter, limit) =>
    pipe(
      te.tryCatch(
        () =>
          mongooseModel
            .find({
              exchange: filter.exchange,
              symbol: filter.symbol,
              timeframe: filter.timeframe,
              closeTimestamp: { $lte: filter.start },
            })
            .limit(limit)
            .sort({ closeTimestamp: 'desc' })
            .lean(),
        createErrorFromUnknown(
          createKlineDaoError(
            'GetBeforeFailed',
            `Getting klines before ${filter.start.toISOString()} failed`,
          ),
        ),
      ),
      te.map((docs) => docs.map(omit(['_id', '__v'])).sort(ascend(prop('closeTimestamp')))),
    );
}
