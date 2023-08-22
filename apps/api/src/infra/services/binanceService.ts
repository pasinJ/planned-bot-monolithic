import Binance from 'binance-api-node';
import te from 'fp-ts/lib/TaskEither.js';
import { constVoid, pipe } from 'fp-ts/lib/function.js';

import { createErrorFromUnknown } from '#shared/error.js';

import { CreateBinanceServiceError } from './binanceService.type.js';

// @ts-expect-error The exported type of 'binance-api-node' may not support ESM, cannot use default export directly
const BinanceClient = Binance.default as unknown as typeof Binance;

export const createBinanceService = pipe(
  te.fromIO(() => BinanceClient()),
  te.chain((client) =>
    te.tryCatch(
      () => client.ping(),
      createErrorFromUnknown(
        CreateBinanceServiceError,
        'CREATE_BINANCE_SERVICE_ERROR',
        'Testing connectivity to Binance server failed',
      ),
    ),
  ),
  te.map(constVoid),
);
