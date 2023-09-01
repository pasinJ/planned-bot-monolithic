import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { ExchangeName } from '#features/exchanges/domain/exchange.js';
import { DateService } from '#infra/services/date.type.js';
import { IdService } from '#infra/services/id.type.js';
import { Timeframe } from '#shared/domain/timeframe.js';

import { AddBtStrategyError, BtStrategyRepo } from '../btStrategy.repository.type.js';
import { BtStrategy, CreateNewBtStrategyError, createNewBtStrategy } from '../domain/btStrategy.entity.js';

export type AddBtStrategyUseCaseDeps = {
  btStrategyRepo: BtStrategyRepo;
  dateService: DateService;
  idService: IdService;
};
export type AddBtStrategyUseCaseData = {
  name: string;
  exchange: ExchangeName;
  symbol: string;
  currency: string;
  timeframe: Timeframe;
  maxNumKlines: number;
  initialCapital: number;
  takerFeeRate: number;
  makerFeeRate: number;
  startTimestamp: Date;
  endTimestamp: Date;
  body: string;
};

export function addBtStrategyUseCase(
  dep: AddBtStrategyUseCaseDeps,
  data: AddBtStrategyUseCaseData,
): te.TaskEither<CreateNewBtStrategyError | AddBtStrategyError, BtStrategy> {
  const { idService, dateService, btStrategyRepo } = dep;

  return pipe(
    te.Do,
    te.bindW('id', () => te.fromIO(idService.generateBtStrategyId)),
    te.bindW('currentDate', () => te.fromIO(dateService.getCurrentDate)),
    te.bindW('btStrategy', ({ id, currentDate }) =>
      te.fromEither(createNewBtStrategy({ ...data, id }, currentDate)),
    ),
    te.chainW(({ btStrategy }) => btStrategyRepo.add(btStrategy)),
  );
}
