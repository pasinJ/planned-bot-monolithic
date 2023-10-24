import { UseMutationResult, useMutation } from '@tanstack/react-query';
import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';

import { ExchangeName } from '#features/exchanges/exchange';
import { Timeframe } from '#features/klines/kline';
import { BaseAsset, QuoteAsset, SymbolName } from '#features/symbols/symbol';
import { InfraContext } from '#infra/InfraProvider.context';
import { createGeneralError } from '#shared/errors/generalError';
import { ValidDate } from '#shared/utils/date';
import { executeTeToPromise } from '#shared/utils/fp';
import { DecimalString, IntegerString, TimezoneString } from '#shared/utils/string';

import { BtStrategyId, StrategyLanguage } from '../btStrategy';
import { UpdateBtStrategyRequest } from '../btStrategy.repository';
import { BtStrategyRepoError } from '../btStrategy.repository.error';

export type UseUpdateBtStrategyRequest = {
  name: string;
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  maxNumKlines: IntegerString;
  startTimestamp: ValidDate;
  endTimestamp: ValidDate;
  capitalCurrency: BaseAsset | QuoteAsset;
  initialCapital: DecimalString;
  takerFeeRate: DecimalString;
  makerFeeRate: DecimalString;
  language: StrategyLanguage;
  body: string;
};
export default function useUpdateBtStrategy(): UseMutationResult<
  void,
  BtStrategyRepoError<'UpdateBtStrategyFailed'>,
  UseUpdateBtStrategyRequest
> {
  const params = useParams();
  const { btStrategyRepo, dateService } = useContext(InfraContext);

  return useMutation({
    mutationFn: (request) =>
      pipe(
        params.id !== undefined
          ? te.right(params.id)
          : te.left(
              createGeneralError(
                'ParamsEmpty',
                'ID params is missing from the current path. It is required for updating backtesting strategy',
              ),
            ),
        te.bindTo('id'),
        te.bindW('timezone', () => te.fromIO(dateService.getTimezone)),
        te.map(({ id, timezone }) => parseMutationRequest(id, timezone, request)),
        te.chainW(btStrategyRepo.updateBtStrategy),
        executeTeToPromise,
      ),
  });
}

function parseMutationRequest(
  id: string,
  timezone: TimezoneString,
  request: UseUpdateBtStrategyRequest,
): UpdateBtStrategyRequest {
  return {
    ...request,
    id: id as BtStrategyId,
    maxNumKlines: Number(request.maxNumKlines),
    initialCapital: Number(request.initialCapital),
    takerFeeRate: Number(request.takerFeeRate),
    makerFeeRate: Number(request.makerFeeRate),
    timezone,
  };
}
