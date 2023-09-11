import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { ExchangeName } from '#features/exchanges/domain/exchange.js';
import { DateService } from '#infra/services/date.type.js';
import { Language } from '#shared/domain/language.js';
import { Timeframe } from '#shared/domain/timeframe.js';

import { BtStrategyId, createNewBtStrategy } from '../domain/btStrategy.entity.js';
import { BtStrategyDomainError } from '../domain/btStrategy.error.js';
import { BtStrategyRepoError } from '../repositories/btStrategy.error.js';
import { BtStrategyRepo } from '../repositories/btStrategy.type.js';

export type AddBtStrategyCommandDeps = { btStrategyRepo: BtStrategyRepo; dateService: DateService };
export type AddBtStrategyCommandData = {
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
  language: Language;
  body: string;
};

export function addBtStrategyCommand(
  dep: AddBtStrategyCommandDeps,
  data: AddBtStrategyCommandData,
): te.TaskEither<
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  BtStrategyDomainError<'CreateBtStrategyError'> | BtStrategyRepoError<'AddBtStrategyError'>,
  { id: BtStrategyId; createdAt: Date }
> {
  const { dateService, btStrategyRepo } = dep;

  return pipe(
    te.Do,
    te.let('id', () => btStrategyRepo.generateId()),
    te.let('currentDate', () => dateService.getCurrentDate()),
    te.bindW('btStrategy', ({ id, currentDate }) =>
      te.fromEither(createNewBtStrategy({ ...data, id }, currentDate)),
    ),
    te.chainFirstW(({ btStrategy }) => btStrategyRepo.add(btStrategy)),
    te.map(({ btStrategy }) => ({ id: btStrategy.id, createdAt: btStrategy.createdAt })),
  );
}
