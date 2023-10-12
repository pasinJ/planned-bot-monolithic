import { CandleChartResult } from 'binance-api-node';
import { addMilliseconds, getTime, isBefore } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { concat, last } from 'ramda';
import { z } from 'zod';

import { exchangeNameEnum } from '#features/shared/exchange.js';
import { Kline, createKline } from '#features/shared/kline.js';
import { SymbolName } from '#features/shared/symbol.js';
import { Timeframe } from '#features/shared/timeframe.js';
import { BnbServiceError, createBnbServiceError } from '#infra/services/binance/error.js';
import { BnbClient } from '#infra/services/binance/service.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';
import { GeneralError } from '#shared/errors/generalError.js';
import { DateRange } from '#shared/utils/date.js';

export type GetKlinesByApi = (
  request: GetKlinesByApiRequest,
) => te.TaskEither<GetKlinesByApiError, readonly Kline[]>;
export type GetKlinesByApiDeps = Readonly<{ bnbClient: BnbClient }>;
export type GetKlinesByApiRequest = Readonly<{
  symbol: SymbolName;
  timeframe: Timeframe;
  dateRange: DateRange;
}>;
export type GetKlinesByApiError = BnbServiceError<'GetKlinesByApiFailed'>;

const MAX_KLINES_LIMIT = 1000;

export function getKlinesByApi(deps: GetKlinesByApiDeps): GetKlinesByApi {
  return (request) => getKlinesRecursive(deps.bnbClient, request, []);
}

function getKlinesRecursive(
  bnbClient: BnbClient,
  request: GetKlinesByApiRequest,
  accKlines: readonly Kline[],
): te.TaskEither<BnbServiceError<'GetKlinesByApiFailed'>, readonly Kline[]> {
  const { symbol, timeframe, dateRange } = request;

  return pipe(
    getKlinesFromBnbServer(bnbClient, symbol, timeframe, dateRange),
    te.chainEitherKW((candles) =>
      pipe(
        candles.map(createKlineFromCandle(symbol, timeframe)),
        e.sequenceArray,
        e.mapLeft((error) =>
          createBnbServiceError(
            'GetKlinesByApiFailed',
            'Error happend when try to create Kline models from returned data',
            error,
          ),
        ),
      ),
    ),
    te.chain((klines) => {
      const lastKline = last(klines);
      const lastBatchReturnedFullLimit = klines.length === MAX_KLINES_LIMIT;
      const lastKlineOfBatchNotReachEndRange = lastKline && isBefore(lastKline.closeTimestamp, dateRange.end);

      if (lastBatchReturnedFullLimit && lastKlineOfBatchNotReachEndRange) {
        const nextStart = addMilliseconds(lastKline.closeTimestamp, 1);
        const nextBatchRange = { start: nextStart, end: dateRange.end } as DateRange;

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
): te.TaskEither<BnbServiceError<'GetKlinesByApiFailed'>, CandleChartResult[]> {
  return te.tryCatch(
    () =>
      bnbClient.candles({
        symbol,
        // @ts-expect-error Library doesn't allow '1s' interval type, but it works
        interval: timeframe,
        startTime: getTime(dateRange.start),
        endTime: getTime(dateRange.end),
        limit: MAX_KLINES_LIMIT,
      }),
    createErrorFromUnknown(
      createBnbServiceError('GetKlinesByApiFailed', 'Getting klines from Binance server failed'),
    ),
  );
}

function createKlineFromCandle(symbol: SymbolName, timeframe: Timeframe) {
  return (candle: CandleChartResult): e.Either<GeneralError<'CreateKlineFailed'>, Kline> =>
    createKline({
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
