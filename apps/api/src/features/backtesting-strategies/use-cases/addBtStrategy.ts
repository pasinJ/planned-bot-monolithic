import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { ExchangeName } from '#features/exchanges/domain/exchange.js';
import { DateService } from '#infra/services/date.type.js';
import { IdService } from '#infra/services/id.type.js';
import { Timeframe } from '#shared/domain/timeframe.js';

import { createNewBtStrategy } from '../domain/btStrategy.entity.js';
import { BtStrategyDomainError } from '../domain/btStrategy.error.js';
import { BtStrategyRepoError } from '../repositories/btStrategy.error.js';
import { BtStrategyRepo } from '../repositories/btStrategy.type.js';

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
): te.TaskEither<
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  BtStrategyDomainError<'CreateBtStrategyError'> | BtStrategyRepoError<'AddBtStrategyError'>,
  void
> {
  const { idService, dateService, btStrategyRepo } = dep;

  return pipe(
    te.Do,
    te.let('id', () => idService.generateBtStrategyId()),
    te.let('currentDate', () => dateService.getCurrentDate()),
    te.bindW('btStrategy', ({ id, currentDate }) =>
      te.fromEither(createNewBtStrategy({ ...data, id }, currentDate)),
    ),
    te.chainW(({ btStrategy }) => btStrategyRepo.add(btStrategy)),
  );
}
