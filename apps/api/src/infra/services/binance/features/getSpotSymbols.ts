import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { __, dissoc, filter, includes, map, pick, prop, propEq, propSatisfies } from 'ramda';

import { BnbSymbol, createBnbSymbol } from '#features/shared/bnbSymbol.js';
import { HttpClient } from '#infra/http/client.type.js';
import { GeneralError } from '#shared/errors/generalError.js';

import { BNB_ENDPOINTS } from '../constants.js';
import { createBnbServiceError } from '../error.js';
import { ExchangeInfoResp, exchangeInfoRespSchema } from '../response-schemas/exchangeInfo.js';

export function getSpotSymbolsList({ httpClient }: { httpClient: Pick<HttpClient, 'sendRequest'> }) {
  return pipe(
    httpClient.sendRequest({
      method: 'GET',
      url: BNB_ENDPOINTS.EXCHANGE_INFO,
      params: { permissions: 'SPOT' },
      responseSchema: exchangeInfoRespSchema,
    }),
    te.chainIOEitherKW(transformExchangeInfoToSymbols),
    te.mapLeft((error) =>
      createBnbServiceError(
        'GetSpotSymbolsFailed',
        'Getting SPOT symbols information from Binance server failed',
        error,
      ),
    ),
  );
}

function transformExchangeInfoToSymbols(
  exchangeInfo: ExchangeInfoResp,
): ioe.IOEither<GeneralError<'CreateSymbolFailed'>, readonly BnbSymbol[]> {
  return pipe(
    prop('symbols', exchangeInfo),
    filter(propEq('TRADING', 'status')),
    map(pickSymbolProps),
    map(renameSymbolProp),
    map((symbol) => ({
      ...symbol,
      filters: symbol.filters
        .map(renameFilterProp)
        .filter(filterSymbolFilters) as RenameFilterProp<RequiredFilter>[],
    })),
    ioe.of,
    ioe.chainW((symbols) =>
      pipe(
        symbols.map((symbol) => ioe.fromEither(createBnbSymbol(symbol))),
        ioe.sequenceArray,
      ),
    ),
  );
}

type SymbolWithOnlyRequiredProperties = Pick<
  ExchangeInfoResp['symbols'][number],
  (typeof propertiesList)[number]
>;
const propertiesList = [
  'symbol',
  'baseAsset',
  'baseAssetPrecision',
  'quoteAsset',
  'quoteAssetPrecision',
  'orderTypes',
  'filters',
] as const;

function pickSymbolProps(symbol: ExchangeInfoResp['symbols'][number]): SymbolWithOnlyRequiredProperties {
  return pick(propertiesList, symbol);
}

type RenameSymbolProp<S extends Record<string, unknown>> = {
  [K in keyof S as K extends 'symbol' ? 'name' : K extends 'orderTypes' ? 'bnbOrderTypes' : K]: S[K];
};
function renameSymbolProp<S extends Record<string, unknown>>(symbol: S): RenameSymbolProp<S> {
  return dissoc('symbol', {
    ...symbol,
    name: symbol.symbol,
    bnbOrderTypes: symbol.orderTypes,
  }) as unknown as RenameSymbolProp<S>;
}

type RenameFilterProp<F extends Record<string, unknown>> = {
  [K in keyof F as K extends 'filterType' ? 'type' : K]: F[K];
};
function renameFilterProp<F extends Record<string, unknown>>(filter: F): RenameFilterProp<F> {
  return dissoc('filterType', { ...filter, type: filter.filterType }) as unknown as RenameFilterProp<F>;
}

type ExchangeInfoSymbolFilter = ExchangeInfoResp['symbols'][number]['filters'][number];
type RequiredFilter = Extract<
  SymbolWithOnlyRequiredProperties['filters'][number],
  { filterType: (typeof filterTypesList)[number] }
>;
const filterTypesList = ['LOT_SIZE', 'MARKET_LOT_SIZE', 'MIN_NOTIONAL', 'NOTIONAL', 'PRICE_FILTER'] as const;
function filterSymbolFilters(filter: RenameFilterProp<ExchangeInfoSymbolFilter>): boolean {
  return propSatisfies(includes(__, filterTypesList), 'type', filter);
}
