import { faker } from '@faker-js/faker';
import { mergeRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import {
  BnbSymbol,
  LotSizeFilter,
  MarketLotSizeFilter,
  MinNotionalFilter,
  NotionalFilter,
  PriceFilter,
} from '#features/shared/bnbSymbol.js';
import { exchangeNameEnum } from '#features/shared/exchange.js';
import { orderTypesList } from '#features/shared/order.js';
import {
  AssetName,
  BaseAssetPrecisionNumber,
  QuoteAssetPrecisionNumber,
  SymbolName,
} from '#features/shared/symbol.js';
import { Unbrand } from '#shared/utils/types.js';
import { randomBoolean } from '#test-utils/faker/boolean.js';
import {
  randomNonNegativeInt,
  randomPositiveFloat,
  randomPositiveInt,
  randomPrecisionStep,
} from '#test-utils/faker/number.js';
import { randomString } from '#test-utils/faker/string.js';

import { _randomExchangeName } from './exchange.js';

export function mockBnbSymbol(override?: DeepPartial<Unbrand<BnbSymbol>>): BnbSymbol {
  return mergeRight<BnbSymbol, DeepPartial<Unbrand<BnbSymbol>>>(
    {
      name: 'BNBUSDT' as SymbolName,
      exchange: exchangeNameEnum.BINANCE,
      baseAsset: 'BNB' as AssetName,
      baseAssetPrecision: 8 as BaseAssetPrecisionNumber,
      quoteAsset: 'USDT' as AssetName,
      quoteAssetPrecision: 8 as QuoteAssetPrecisionNumber,
      orderTypes: ['MARKET', 'LIMIT', 'STOP_MARKET', 'STOP_LIMIT'],
      bnbOrderTypes: ['MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LOSS_LIMIT'],
      filters: [],
    },
    override ?? {},
  ) as BnbSymbol;
}

export function _generateRandomBnbSymbol() {
  const minRange: [number, number] = [1, 10];
  const maxRange: [number, number] = [11, 20];

  return {
    name: randomString(),
    exchange: _randomExchangeName(),
    baseAsset: randomString(),
    baseAssetPrecision: randomPositiveInt(),
    quoteAsset: randomString(),
    quoteAssetPrecision: randomPositiveInt(),
    orderTypes: faker.helpers.arrayElements(orderTypesList),
    filters: [
      _generateRandomLotSizeFilter({ minQtyRange: minRange, maxQtyRange: maxRange }),
      _generateRandomMarketLotSizeFilter({ minQtyRange: minRange, maxQtyRange: maxRange }),
      _generateRandomMinNotionalFilter(),
      _generateRandomNotionalFilter(),
      _generateRandomPriceFilter({ minPriceRange: minRange, maxPriceRange: maxRange }),
    ],
  };
}

export function _generateRandomLotSizeFilter(
  {
    minQty,
    maxQty,
    stepSize,
    minQtyRange = [1, 10],
    maxQtyRange = [11, 20],
  }: {
    minQty?: number;
    maxQty?: number;
    stepSize?: number;
    minQtyRange?: [number, number];
    maxQtyRange?: [number, number];
  } = { minQtyRange: [1, 10], maxQtyRange: [11, 20] },
): LotSizeFilter {
  return {
    type: 'LOT_SIZE',
    minQty: minQty ?? randomPositiveFloat(8, minQtyRange),
    maxQty: maxQty ?? randomPositiveFloat(8, maxQtyRange),
    stepSize: stepSize ?? randomPrecisionStep(),
  } as LotSizeFilter;
}

export function _generateRandomMarketLotSizeFilter(
  {
    minQty,
    maxQty,
    stepSize,
    minQtyRange = [1, 10],
    maxQtyRange = [11, 20],
  }: {
    minQty?: number;
    maxQty?: number;
    stepSize?: number;
    minQtyRange?: [number, number];
    maxQtyRange?: [number, number];
  } = { minQtyRange: [1, 10], maxQtyRange: [11, 20] },
): MarketLotSizeFilter {
  return {
    type: 'MARKET_LOT_SIZE',
    minQty: minQty ?? randomPositiveFloat(8, minQtyRange),
    maxQty: maxQty ?? randomPositiveFloat(8, maxQtyRange),
    stepSize: stepSize ?? randomPrecisionStep(),
  } as MarketLotSizeFilter;
}

export function _generateRandomMinNotionalFilter(override?: Partial<MinNotionalFilter>): MinNotionalFilter {
  return {
    type: 'MIN_NOTIONAL',
    minNotional: randomPositiveFloat(8),
    applyToMarket: randomBoolean(),
    avgPriceMins: randomNonNegativeInt(),
    ...override,
  } as MinNotionalFilter;
}

export function _generateRandomNotionalFilter(override?: Partial<NotionalFilter>): NotionalFilter {
  return {
    type: 'NOTIONAL',
    minNotional: randomPositiveFloat(8),
    applyMinToMarket: randomBoolean(),
    maxNotional: randomPositiveFloat(8),
    applyMaxToMarket: randomBoolean(),
    avgPriceMins: randomNonNegativeInt(),
    ...override,
  } as NotionalFilter;
}

export function _generateRandomPriceFilter(
  {
    minPrice,
    maxPrice,
    tickSize,
    minPriceRange = [1, 10],
    maxPriceRange = [11, 20],
  }: {
    minPrice?: number;
    maxPrice?: number;
    tickSize?: number;
    minPriceRange?: [number, number];
    maxPriceRange?: [number, number];
  } = { minPriceRange: [1, 10], maxPriceRange: [11, 20] },
): PriceFilter {
  return {
    type: 'PRICE_FILTER',
    minPrice: minPrice ?? randomPositiveFloat(8, minPriceRange),
    maxPrice: maxPrice ?? randomPositiveFloat(8, maxPriceRange),
    tickSize: tickSize ?? randomPrecisionStep(),
  } as PriceFilter;
}
