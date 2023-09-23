import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { dissoc, zipObj } from 'ramda';
import { z } from 'zod';

import { ExchangeName } from '#features/shared/domain/exchange.js';
import { Timeframe } from '#features/shared/domain/timeframe.js';
import { SymbolName } from '#features/symbols/dataModels/symbol.js';

import { CreateKlineModelError, KlineModel, createKlineModel } from '../dataModels/kline.js';

export function transformKlineCsvToKlineModel(request: {
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
}) {
  return (row: string[]): e.Either<CreateKlineModelError, KlineModel> => {
    const columns = [
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

    return createKlineModel({
      ...request,
      ...pipe(
        zipObj(
          columns,
          row.map((cell) => z.coerce.number().parse(cell)),
        ),
        dissoc('ignore'),
      ),
    });
  };
}
