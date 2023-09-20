import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { includes, pathOr } from 'ramda';

import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { KlineModel } from '../data-models/kline.js';
import { createKlineDaoError } from './kline.error.js';
import { KlineMongooseModel } from './kline.js';

export function addKlineModels({ mongooseModel }: { mongooseModel: KlineMongooseModel }) {
  return (klines: KlineModel | readonly KlineModel[]) =>
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
