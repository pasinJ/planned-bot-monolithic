import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { DateService } from '#infra/services/date/service.type.js';
import { GeneralError } from '#shared/errors/generalError.js';
import { SchemaValidationError } from '#shared/utils/zod.js';

import { BtStrategyModelDaoError } from '../data-models/btStrategy.dao.error.js';
import { BtStrategyModelDao } from '../data-models/btStrategy.dao.type.js';
import { BtStrategyId, createBtStrategyModel } from '../data-models/btStrategy.model.js';

export type AddBtStrategyDeps = {
  btStrategyModelDao: Pick<BtStrategyModelDao, 'generateId' | 'add'>;
  dateService: Pick<DateService, 'getCurrentDate'>;
};
export type AddBtStrategyRequest = {
  name: string;
  exchange: string;
  symbol: string;
  currency: string;
  timeframe: string;
  maxNumKlines: number;
  initialCapital: number;
  takerFeeRate: number;
  makerFeeRate: number;
  startTimestamp: Date;
  endTimestamp: Date;
  language: string;
  body: string;
};

export function addBtStrategy(
  dep: AddBtStrategyDeps,
  data: AddBtStrategyRequest,
): te.TaskEither<
  BtStrategyModelDaoError<'AddFailed'> | GeneralError<'CreateBtStrategyError', SchemaValidationError>,
  { id: BtStrategyId; createdAt: Date }
> {
  const { dateService, btStrategyModelDao } = dep;

  return pipe(
    te.Do,
    te.let('id', () => btStrategyModelDao.generateId()),
    te.let('currentDate', () => dateService.getCurrentDate()),
    te.bindW('btStrategy', ({ id, currentDate }) =>
      te.fromEither(createBtStrategyModel({ ...data, id }, currentDate)),
    ),
    te.chainFirstW(({ btStrategy }) => btStrategyModelDao.add(btStrategy)),
    te.map(({ btStrategy }) => ({ id: btStrategy.id, createdAt: btStrategy.createdAt })),
  );
}
