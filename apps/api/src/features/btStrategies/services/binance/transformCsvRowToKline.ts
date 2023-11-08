import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { dissoc, zipObj } from 'ramda';
import { z } from 'zod';

import { ExchangeName } from '#features/shared/exchange.js';
import { Kline, createKline } from '#features/shared/kline.js';
import { SymbolName } from '#features/shared/symbol.js';
import { Timeframe } from '#features/shared/timeframe.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';

export function transformCsvRowToKline(request: {
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
}) {
  return (row: string[]): e.Either<GeneralError<'TransformCsvRowFailed'>, Kline> => {
    const headers = [
      'openTimestamp',
      'open',
      'high',
      'low',
      'close',
      'volume',
      'closeTimestamp',
      'quoteAssetVolume',
      'numTrades',
      'takerBuyBaseAssetVolume',
      'takerBuyQuoteAssetVolume',
      'ignore',
    ] as const;

    const mapWithHeaders = zipObj(headers);
    const dropIgnoreColumn = dissoc('ignore');

    return pipe(
      e.tryCatch(
        () => row.map((cell) => z.coerce.number().parse(cell)),
        createErrorFromUnknown(
          createGeneralError('TransformCsvRowFailed', 'Csv row includes non-number data'),
        ),
      ),
      e.chainW((parsedRow) =>
        pipe(
          createKline({ ...request, ...pipe(mapWithHeaders(parsedRow), dropIgnoreColumn) }),
          e.mapLeft((error) =>
            createGeneralError('TransformCsvRowFailed', 'Csv row includes invalid data', error),
          ),
        ),
      ),
    );
  };
}
