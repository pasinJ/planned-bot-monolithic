import { UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ExchangeName } from '#features/exchanges/exchange';
import { Timeframe } from '#features/klines/kline';
import { SymbolName } from '#features/symbols/symbol';
import { InfraContext } from '#infra/InfraProvider.context';
import { executeTeToPromise } from '#shared/utils/fp';

import {
  AssetCurrency,
  BtRange,
  BtStrategyBody,
  BtStrategyId,
  BtStrategyName,
  CapitalCurrency,
  InitialCapital,
  MakerFeeRate,
  MaxNumKlines,
  StrategyLanguage,
  TakerFeeRate,
} from '../btStrategy';
import { AddBtStrategyError, UpdateBtStrategyError } from '../btStrategy.repository';

export type UseSaveBtStrategyRequest = {
  name: BtStrategyName;
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  maxNumKlines: MaxNumKlines;
  btRange: BtRange;
  assetCurrency: AssetCurrency;
  capitalCurrency: CapitalCurrency;
  initialCapital: InitialCapital;
  takerFeeRate: TakerFeeRate;
  makerFeeRate: MakerFeeRate;
  language: StrategyLanguage;
  body: BtStrategyBody;
};
export default function useSaveBtStrategy(): UseMutationResult<
  BtStrategyId,
  AddBtStrategyError | UpdateBtStrategyError,
  UseSaveBtStrategyRequest
> {
  const { btStrategyRepo, dateService } = useContext(InfraContext);
  const queryClient = useQueryClient();
  const params = useParams();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (request) =>
      params.btStrategyId === undefined
        ? pipe(
            te.fromIO(dateService.getTimezone),
            te.chainW((timezone) => btStrategyRepo.addBtStrategy({ ...request, timezone })),
            te.map(({ id }) => id),
            te.chainFirstIOK((id) => () => navigate(`./${id}`, { replace: true, relative: 'path' })),
            executeTeToPromise,
          )
        : pipe(
            te.Do,
            te.let('id', () => params.btStrategyId as BtStrategyId),
            te.bindW('timezone', () => te.fromIO(dateService.getTimezone)),
            te.chainFirstW(({ id, timezone }) =>
              btStrategyRepo.updateBtStrategy({ id, ...request, timezone }),
            ),
            te.chainFirstIOK(
              ({ id }) =>
                () =>
                  queryClient.invalidateQueries(['btStrategy', id]),
            ),
            te.map(({ id }) => id),
            executeTeToPromise,
          ),
  });
}
