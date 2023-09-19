import { getTime, isBefore } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { concat, last } from 'ramda';
import { z } from 'zod';

import { exchangeNameEnum } from '#features/shared/domain/exchangeName.js';
import { SymbolName } from '#features/shared/domain/symbolName.js';
import { Timeframe } from '#features/shared/domain/timeframe.js';
import { BnbServiceError, createBnbServiceError } from '#infra/services/binance/error.js';
import { BnbClient } from '#infra/services/binance/service.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { KlineModel, createKlineModel } from '../data-models/kline.js';
import { DateRange } from './getKlinesForBt.js';

export type GetKlinesFromApiDeps = { bnbClient: BnbClient };
export type GetKlinesFromApiRequest = { symbol: SymbolName; timeframe: Timeframe; dateRange: DateRange };

export function getKlinesFromApi(deps: GetKlinesFromApiDeps) {
  return (
    request: GetKlinesFromApiRequest,
  ): te.TaskEither<BnbServiceError<'GetKlinesFromApiFailed'>, readonly KlineModel[]> =>
    getKlinesRecursive(deps.bnbClient, request, []);
}

function getKlinesRecursive(
  bnbClient: BnbClient,
  request: GetKlinesFromApiRequest,
  accKlines: readonly KlineModel[],
): te.TaskEither<BnbServiceError<'GetKlinesFromApiFailed'>, readonly KlineModel[]> {
  const { symbol, timeframe, dateRange } = request;

  return pipe(
    te.tryCatch(
      () =>
        bnbClient.candles({
          symbol,
          // @ts-expect-error Library doesn't allow '1s' interval type, but it works
          interval: timeframe,
          startTime: getTime(dateRange.start),
          endTime: getTime(dateRange.end),
          limit: 1000,
        }),
      createErrorFromUnknown(
        createBnbServiceError('GetKlinesFromApiFailed', 'Getting klines from Binance server failed'),
      ),
    ),
    te.chainEitherKW((candles) =>
      pipe(
        candles.map((candle) =>
          createKlineModel({
            exchange: exchangeNameEnum.BINANCE,
            symbol,
            timeframe,
            openTimestamp: candle.openTime,
            closeTimestamp: candle.closeTime,
            open: z.coerce.number().parse(candle.open),
            close: z.coerce.number().parse(candle.close),
            high: z.coerce.number().parse(candle.high),
            low: z.coerce.number().parse(candle.low),
            volume: z.coerce.number().parse(candle.volume),
            quoteAssetVolume: z.coerce.number().parse(candle.quoteAssetVolume),
            takerBuyBaseAssetVolume: z.coerce.number().parse(candle.baseAssetVolume),
            takerBuyQuoteAssetVolume: z.coerce.number().parse(candle.quoteAssetVolume),
            numTrades: candle.trades,
          }),
        ),
        e.sequenceArray,
        e.mapLeft((error) =>
          createBnbServiceError(
            'GetKlinesFromApiFailed',
            'Error happend when try to create Kline model from returned data',
            error,
          ),
        ),
      ),
    ),
    te.chain((klines) => {
      const lastKline = last(klines);

      if (klines.length === 1000 && lastKline && isBefore(lastKline.closeTimestamp, dateRange.end)) {
        return getKlinesRecursive(
          bnbClient,
          {
            symbol,
            timeframe,
            dateRange: { start: lastKline.closeTimestamp, end: dateRange.end } as DateRange,
          },
          concat(accKlines, klines),
        );
      } else {
        return te.right(concat(accKlines, klines));
      }
    }),
  );
}
