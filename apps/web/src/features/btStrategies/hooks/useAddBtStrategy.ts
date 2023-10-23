import { UseMutationResult, useMutation } from '@tanstack/react-query';
import * as io from 'fp-ts/lib/IO';
import * as te from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { useContext } from 'react';

import { ExchangeName } from '#features/exchanges/exchange';
import { Timeframe } from '#features/klines/kline';
import { BaseAsset, QuoteAsset, SymbolName } from '#features/symbols/symbol';
import { InfraContext } from '#infra/InfraProvider.context';
import { ValidDate } from '#shared/utils/date';
import { executeTeToPromise } from '#shared/utils/fp';
import { DecimalString, IntegerString, TimezoneString } from '#shared/utils/string';
import { SchemaValidationError } from '#shared/utils/zod';

import { StrategyLanguage } from '../btStrategy';
import { AddBtStrategyRequest, AddBtStrategyResult } from '../btStrategy.repository';
import { BtStrategyRepoError } from '../btStrategy.repository.error';

export type UseAddBtStrategyRequest = {
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
export default function useAddBtStrategy(): UseMutationResult<
  AddBtStrategyResult,
  BtStrategyRepoError<'AddBtStrategyFailed'> | SchemaValidationError,
  UseAddBtStrategyRequest
> {
  const { btStrategyRepo, dateService } = useContext(InfraContext);

  return useMutation({
    mutationFn: (request) =>
      pipe(
        dateService.getTimezone,
        io.map((timezone) => parseMutationRequest(request, timezone)),
        te.fromIO,
        te.chainW(btStrategyRepo.addBtStrategy),
        executeTeToPromise,
      ),
  });
}

function parseMutationRequest(
  request: UseAddBtStrategyRequest,
  timezone: TimezoneString,
): AddBtStrategyRequest {
  return {
    ...request,
    maxNumKlines: Number(request.maxNumKlines),
    initialCapital: Number(request.initialCapital),
    takerFeeRate: Number(request.takerFeeRate),
    makerFeeRate: Number(request.makerFeeRate),
    timezone,
  };
}
