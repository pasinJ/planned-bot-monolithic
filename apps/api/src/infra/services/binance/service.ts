import { CreateAxiosDefaults } from 'axios';
import Binance from 'binance-api-node';
import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { buildAxiosHttpClient } from '#infra/http/client.js';
import { HttpClient } from '#infra/http/client.type.js';
import { LoggerIo, PinoLogger, createLoggerIo } from '#infra/logging.js';

import { BnbServiceError } from './error.js';

// @ts-expect-error The exported type of 'binance-api-node' may not support ESM, cannot use default export directly
const createBnbClient = Binance.default as unknown as typeof Binance;
export type BnbClient = ReturnType<typeof Binance>;
type BnbClientOptions = Parameters<typeof createBnbClient>[0];

export type BnbService = Readonly<{
  composeWith: <R>(
    fn: (internal: { bnbClient: BnbClient; httpClient: HttpClient; loggerIo: LoggerIo }) => R,
  ) => R;
}>;

export type BnbServiceDeps = { mainLogger: PinoLogger; getBnbConfig: io.IO<{ HTTP_BASE_URL: string }> };
export function buildBnbService(
  deps: BnbServiceDeps,
): ioe.IOEither<BnbServiceError<'CreateServiceFailed'>, BnbService> {
  const loggerIo = createLoggerIo('BnbService', deps.mainLogger);

  return pipe(
    ioe.fromIO(() => {
      const { HTTP_BASE_URL } = deps.getBnbConfig();
      const httpClientOptions: CreateAxiosDefaults = { baseURL: HTTP_BASE_URL };
      const bnbClientOptions: BnbClientOptions = { httpBase: HTTP_BASE_URL };

      return { httpClientOptions, bnbClientOptions };
    }),
    ioe.let('httpClient', ({ httpClientOptions }) => buildAxiosHttpClient(loggerIo, httpClientOptions)),
    ioe.let('bnbClient', ({ bnbClientOptions }) => createBnbClient(bnbClientOptions)),
    ioe.map(
      ({ httpClient, bnbClient }) =>
        ({ composeWith: (fn) => fn({ bnbClient, httpClient, loggerIo }) }) as BnbService,
    ),
    ioe.chainFirstIOK(() => loggerIo.infoIo('Binance service created')),
  );
}
