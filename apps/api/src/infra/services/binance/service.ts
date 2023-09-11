import { CreateAxiosDefaults } from 'axios';
import Binance from 'binance-api-node';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { SymbolRepo } from '#features/symbols/repositories/symbol.type.js';
import { createAxiosHttpClient } from '#infra/http/client.js';
import { PinoLogger, createLoggerIo } from '#infra/logging.js';
import { getBnbConfig } from '#shared/config/binance.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { DateService } from '../date.type.js';
import { BnbServiceError, createBnbServiceError } from './error.js';
import { getSpotSymbols } from './features/getSpotSymbols.js';
import { BnbService } from './service.type.js';

// @ts-expect-error The exported type of 'binance-api-node' may not support ESM, cannot use default export directly
const createBnbClient = Binance.default as unknown as typeof Binance;
type BnbClient = ReturnType<typeof createBnbClient>;
type BnbClientOptions = Parameters<typeof createBnbClient>[0];

type CreateBnbServiceDeps = { dateService: DateService; symbolRepo: SymbolRepo; mainLogger: PinoLogger };
export function createBnbService(
  deps: CreateBnbServiceDeps,
): te.TaskEither<BnbServiceError<'CreateBnbServiceError'>, BnbService> {
  const { HTTP_BASE_URL } = getBnbConfig();
  const httpClientOptions: CreateAxiosDefaults = { baseURL: HTTP_BASE_URL };
  const bnbClientOptions: BnbClientOptions = { httpBase: HTTP_BASE_URL };
  const logger = createLoggerIo('BnbService', deps.mainLogger);

  return pipe(
    te.Do,
    te.let('httpClient', () => createAxiosHttpClient(logger, httpClientOptions)),
    te.let('bnbClient', () => createBnbClient(bnbClientOptions)),
    te.chainFirst(({ bnbClient }) => testBnbClientConnectivity(bnbClient)),
    te.let('deps', ({ httpClient, bnbClient }) => ({ ...deps, httpClient, bnbClient })),
    te.map(({ deps }) => ({ getSpotSymbols: getSpotSymbols(deps) })),
    te.chainFirstIOK(() => logger.infoIo('Binance service created')),
  );
}

function testBnbClientConnectivity(
  bnbClient: BnbClient,
): te.TaskEither<BnbServiceError<'CreateBnbServiceError'>, void> {
  return pipe(
    te.tryCatch(
      () => bnbClient.ping(),
      createErrorFromUnknown(
        createBnbServiceError('CreateBnbServiceError', 'Testing connectivity to Binance server failed'),
      ),
    ),
    te.asUnit,
  );
}
