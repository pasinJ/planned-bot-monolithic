import e from 'fp-ts/lib/Either.js';
import { zipObj } from 'ramda';
import { z } from 'zod';

import { ExchangeName } from '#features/shared/domain/exchangeName.js';
import { SymbolName } from '#features/shared/domain/symbolName.js';
import { Timeframe } from '#features/shared/domain/timeframe.js';

import { CreateKlineModelError, KlineModel, createKlineModel } from '../data-models/kline.js';

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
      ...zipObj(
        columns,
        row.map((cell) => z.coerce.number().parse(cell)),
      ),
    });
  };
}
