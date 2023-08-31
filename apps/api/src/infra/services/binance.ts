import { CreateAxiosDefaults } from 'axios';
import Binance from 'binance-api-node';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { flow, pipe } from 'fp-ts/lib/function.js';
import { filter, includes, map, pick, prop, propEq } from 'ramda';

import { createSymbol } from '#features/symbols/domain/symbol.entity.js';
import { createAxiosHttpClient } from '#infra/http/client.js';
import { HttpClient } from '#infra/http/client.type.js';
import { PinoLogger, createLoggerIo } from '#infra/logging.js';
import { getBnbConfig } from '#shared/config/binance.js';
import { createErrorFromUnknown } from '#shared/error.js';

import { BNB_PATHS } from './binance.constant.js';
import {
  BnbService,
  CreateBnbServiceError,
  ExchangeInfoRespFilterSchema,
  GetBnbSpotSymbolsError,
  exchangeInfoRespSchema,
} from './binance.type.js';
import { DateService } from './date.type.js';
import { IdService } from './id.type.js';

// @ts-expect-error The exported type of 'binance-api-node' may not support ESM, cannot use default export directly
const BnbClient = Binance.default as unknown as typeof Binance;

type CreateBnbServiceDeps = { dateService: DateService; idService: IdService; mainLogger: PinoLogger };
export function createBnbService(
  deps: CreateBnbServiceDeps,
): te.TaskEither<CreateBnbServiceError, BnbService> {
  const { HTTP_BASE_URL } = getBnbConfig();
  const logger = createLoggerIo('BnbService', deps.mainLogger);
  const httpClientOptions: CreateAxiosDefaults = { baseURL: HTTP_BASE_URL };
  const bnbClientOptions: Parameters<typeof BnbClient>[0] = { httpBase: HTTP_BASE_URL };

  return pipe(
    te.Do,
    te.bindW('httpClient', () => te.fromIO(() => createAxiosHttpClient(logger, httpClientOptions))),
    te.bindW('bnbClient', () => te.fromIO(() => BnbClient(bnbClientOptions))),
    te.bindW('deps', ({ httpClient, bnbClient }) => te.of({ ...deps, httpClient, bnbClient })),
    te.chainFirst(({ bnbClient }) =>
      te.tryCatch(
        () => bnbClient.ping(),
        createErrorFromUnknown(
          CreateBnbServiceError,
          'CREATE_BNB_SERVICE_ERROR',
          'Testing connectivity to Binance server failed',
        ),
      ),
    ),
    te.map(({ deps }) => ({ getSpotSymbols: buildGetSpotSymbols(deps) })),
    te.chainFirstIOK(() => logger.infoIo('Binance service created')),
  );
}

type GetSpotSymbolsDeps = { httpClient: HttpClient; dateService: DateService; idService: IdService };
function buildGetSpotSymbols(deps: GetSpotSymbolsDeps): BnbService['getSpotSymbols'] {
  const {
    httpClient,
    dateService: { getCurrentDate },
    idService: { generateSymbolId },
  } = deps;
  const propertiesList = [
    'symbol',
    'baseAsset',
    'baseAssetPrecision',
    'quoteAsset',
    'quoteAssetPrecision',
    'orderTypes',
    'filters',
  ];
  const filterTypesList = [
    'LOT_SIZE',
    'MARKET_LOT_SIZE',
    'MIN_NOTIONAL',
    'NOTIONAL',
    'PRICE_FILTER',
  ] as const;
  type RequiredFilterTypes = Extract<
    ExchangeInfoRespFilterSchema['filterType'],
    (typeof filterTypesList)[number]
  >;
  type RequiredFilter = Extract<ExchangeInfoRespFilterSchema, { filterType: RequiredFilterTypes }>;
  type RenameFilterKey<T extends RequiredFilter['filterType']> = {
    [k in RequiredFilter['filterType']]: Omit<Extract<RequiredFilter, { filterType: k }>, 'filterType'> & {
      type: k;
    };
  }[T];

  return pipe(
    httpClient.sendRequest({
      method: 'GET',
      url: BNB_PATHS.exchangeInfo,
      params: { permissions: 'SPOT' },
      responseSchema: exchangeInfoRespSchema,
    }),
    te.map(flow(prop('symbols'), filter(propEq('TRADING', 'status')), map(flow(pick(propertiesList))))),
    te.map(
      flow(
        map(({ filters, ...rest }) => ({
          ...rest,
          filters: filters.filter(({ filterType }) =>
            includes(filterType, filterTypesList),
          ) as RequiredFilter[],
        })),
        map(({ symbol, filters, ...rest }) => ({
          ...rest,
          name: symbol,
          filters: filters.map(
            ({ filterType, ...rest }) =>
              ({ ...rest, type: filterType }) as RenameFilterKey<typeof filterType>,
          ),
        })),
      ),
    ),
    te.chainEitherKW((symbols) =>
      e.sequenceArray(
        symbols.map((symbol) => createSymbol({ ...symbol, id: generateSymbolId() }, getCurrentDate())),
      ),
    ),
    te.mapLeft((error) => new GetBnbSpotSymbolsError().causedBy(error)),
  );
}
