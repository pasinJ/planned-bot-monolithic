import { CandleChartResult } from 'binance-api-node';
import { getTime, isBefore } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { concat, last } from 'ramda';
import { z } from 'zod';

import { exchangeNameEnum } from '#features/shared/domain/exchange.js';
import { Timeframe } from '#features/shared/domain/timeframe.js';
import { SymbolName } from '#features/symbols/dataModels/symbol.js';
import { BnbServiceError, createBnbServiceError } from '#infra/services/binance/error.js';
import { BnbClient } from '#infra/services/binance/service.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';
import { DateRange } from '#shared/utils/date.js';

import { CreateKlineModelError, KlineModel, createKlineModel } from '../dataModels/kline.js';

export type GetKlinesFromApiDeps = Readonly<{ bnbClient: BnbClient }>;
export type GetKlinesFromApiRequest = Readonly<{
  symbol: SymbolName;
  timeframe: Timeframe;
  dateRange: DateRange;
}>;

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
  const limit = 1000;

  return pipe(
    getKlinesFromBnbServer(bnbClient, symbol, timeframe, dateRange, limit),
    te.chainEitherKW((candles) =>
      pipe(
        candles.map(createKlineModelFromCandle(symbol, timeframe)),
        e.sequenceArray,
        e.mapLeft((error) =>
          createBnbServiceError(
            'GetKlinesFromApiFailed',
            'Error happend when try to create Kline models from returned data',
            error,
          ),
        ),
      ),
    ),
    te.chain((klines) => {
      const lastKline = last(klines);
      const lastBatchReturnedFullLimit = klines.length === limit;
      const lastKlineOfBatchNotReachEndRange = lastKline && isBefore(lastKline.closeTimestamp, dateRange.end);

      if (lastBatchReturnedFullLimit && lastKlineOfBatchNotReachEndRange) {
        const nextBatchRange = { start: lastKline.closeTimestamp, end: dateRange.end } as DateRange;
        return getKlinesRecursive(
          bnbClient,
          { symbol, timeframe, dateRange: nextBatchRange },
          concat(accKlines, klines),
        );
      } else {
        return te.right(concat(accKlines, klines));
      }
    }),
  );
}

function getKlinesFromBnbServer(
  bnbClient: BnbClient,
  symbol: SymbolName,
  timeframe: Timeframe,
  dateRange: DateRange,
  limit: number,
): te.TaskEither<BnbServiceError<'GetKlinesFromApiFailed'>, CandleChartResult[]> {
  return te.tryCatch(
    () =>
      bnbClient.candles({
        symbol,
        // @ts-expect-error Library doesn't allow '1s' interval type, but it works
        interval: timeframe,
        startTime: getTime(dateRange.start),
        endTime: getTime(dateRange.end),
        limit,
      }),
    createErrorFromUnknown(
      createBnbServiceError('GetKlinesFromApiFailed', 'Getting klines from Binance server failed'),
    ),
  );
}

function createKlineModelFromCandle(symbol: SymbolName, timeframe: Timeframe) {
  return (candle: CandleChartResult): e.Either<CreateKlineModelError, KlineModel> =>
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
    });
}
