import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import t from 'fp-ts/lib/Task.js';
import te from 'fp-ts/lib/TaskEither.js';
import { flow, pipe } from 'fp-ts/lib/function.js';
import { Cursor, QueryOptions } from 'mongoose';
import { includes, isNotNil, mergeAll, omit, pathOr, reject } from 'ramda';

import { ExchangeName } from '#features/shared/domain/exchange.js';
import { Timeframe } from '#features/shared/domain/timeframe.js';
import { SymbolName } from '#features/symbols/dataModels/symbol.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';
import { ValidDate } from '#shared/utils/date.js';
import { isUndefined } from '#shared/utils/general.js';

import { KlineModel } from '../dataModels/kline.js';
import { KlineDaoError, createKlineDaoError } from './kline.error.js';
import { KlineMongooseModel } from './kline.js';

export function addKlineModels({ mongooseModel }: { mongooseModel: KlineMongooseModel }) {
  return (klines: KlineModel | readonly KlineModel[]): te.TaskEither<KlineDaoError<'AddFailed'>, void> =>
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

export function iterateThroughKlineModels({ mongooseModel }: { mongooseModel: KlineMongooseModel }) {
  return <E>(
    filter: Partial<{
      exchange: ExchangeName;
      symbol: SymbolName;
      timeframe: Timeframe;
      start: ValidDate;
      end: ValidDate;
    }>,
    {
      onEach = () => te.right(undefined),
      onFinish = () => undefined,
      onError = () => () => undefined,
    }: {
      onEach?: (klineModel: KlineModel) => te.TaskEither<E, void>;
      onFinish?: io.IO<void>;
      onError?: (error: E | KlineDaoError<'GetNextIteratorItemFailed'>) => io.IO<void>;
    } = {},
  ): ioe.IOEither<KlineDaoError<'CreateIteratorFailed'>, void> => {
    function cursorLoop(cursor: Cursor<KlineModel, QueryOptions>): t.Task<void> {
      return pipe(
        te.tryCatch(
          () => cursor.next(),
          createErrorFromUnknown(
            createKlineDaoError('GetNextIteratorItemFailed', 'Cursor.next() return error'),
          ),
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
