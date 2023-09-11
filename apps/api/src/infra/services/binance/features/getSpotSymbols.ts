import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { __, dissoc, filter, includes, map, pick, prop, propEq, propSatisfies } from 'ramda';

import { Symbol, createSymbol } from '#features/symbols/domain/symbol.entity.js';
import { SymbolDomainError } from '#features/symbols/domain/symbol.error.js';
import { SymbolRepo } from '#features/symbols/repositories/symbol.type.js';
import { HttpClient } from '#infra/http/client.type.js';
import { DateService } from '#infra/services/date.type.js';

import { ExchangeInfoResp, exchangeInfoRespSchema } from '../api.type.js';
import { BNB_ENDPOINT_PATHS } from '../constants.js';
import { createBnbServiceError } from '../error.js';
import { BnbService } from '../service.type.js';

type GetSpotSymbolsDeps = { httpClient: HttpClient; dateService: DateService; symbolRepo: SymbolRepo };
export function getSpotSymbols(deps: GetSpotSymbolsDeps): BnbService['getSpotSymbols'] {
  const { httpClient, dateService, symbolRepo } = deps;

  return pipe(
    httpClient.sendRequest({
      method: 'GET',
      url: BNB_ENDPOINT_PATHS.exchangeInfo,
      params: { permissions: 'SPOT' },
      responseSchema: exchangeInfoRespSchema,
    }),
    te.chainIOEitherKW(transformExchangeInfoToSymbols(dateService, symbolRepo)),
    te.mapLeft((error) =>
      createBnbServiceError(
        'GetBnbSpotSymbolsError',
        'Getting SPOT symbols information from Binance server failed',
        error,
      ),
    ),
  );
}

function transformExchangeInfoToSymbols(dateService: DateService, symbolRepo: SymbolRepo) {
  return (
    exchangeInfo: ExchangeInfoResp,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  ): ioe.IOEither<SymbolDomainError<'CreateSymbolError'>, readonly Symbol[]> =>
    pipe(
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
        ioe.sequenceArray(
          symbols.map((symbol) =>
            pipe(
              ioe.Do,
              ioe.let('id', () => symbolRepo.generateId()),
              ioe.let('currentDate', () => dateService.getCurrentDate()),
              ioe.chainEitherK(({ id, currentDate }) => createSymbol({ ...symbol, id }, currentDate)),
            ),
          ),
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
  [K in keyof S as K extends 'symbol' ? 'name' : K]: S[K];
};
function renameSymbolProp<S extends Record<string, unknown>>(symbol: S): RenameSymbolProp<S> {
  return dissoc('symbol', { ...symbol, name: symbol.symbol }) as unknown as RenameSymbolProp<S>;
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
