import { faker } from '@faker-js/faker';

import {
  AssetName,
  LotSizeFilter,
  MarketLotSizeFilter,
  MinNotionalFilter,
  NotionalFilter,
  PriceFilter,
  SymbolModel,
  SymbolName,
  orderTypeList,
} from '#features/symbols/dataModels/symbol.js';
import { RemoveBrandFromObjVal } from '#shared/utils/types.js';
import { randomBoolean } from '#test-utils/faker/boolean.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import {
  randomNonNegativeInt,
  randomPositiveFloat,
  randomPositiveInt,
  randomPrecisionStep,
} from '#test-utils/faker/number.js';
import { randomString } from '#test-utils/faker/string.js';

import { randomExchangeName } from '../shared/domain.js';

export function mockSymbol(override?: Partial<RemoveBrandFromObjVal<SymbolModel>>): SymbolModel {
  const minRange: [number, number] = [1, 10];
  const maxRange: [number, number] = [11, 20];

  return {
    name: randomString(),
    exchange: randomExchangeName(),
    baseAsset: randomString(),
    baseAssetPrecision: randomPositiveInt(),
    quoteAsset: randomString(),
    quoteAssetPrecision: randomPositiveInt(),
    orderTypes: generateArrayOf(randomOrderType),
    filters: [
      mockLotSizeFilter(minRange, maxRange),
      mockMarketLotSizeFilter(minRange, maxRange),
      mockMinNotionalFilter(),
      mockNotionalFilter(),
      mockPriceFilter(minRange, maxRange),
    ],
    ...override,
  } as SymbolModel;
}

export function randomSymbolName() {
  return faker.string.alpha({ length: 6, casing: 'upper' }) as SymbolName;
}

export function randomAssetName() {
  return faker.string.alpha({ length: 3, casing: 'upper' }) as AssetName;
}

export function randomOrderType() {
  return faker.helpers.arrayElement(orderTypeList);
}

export function mockLotSizeFilter(
  minQtyRange: [number, number] = [1, 10],
  maxQtyRange: [number, number] = [11, 20],
): LotSizeFilter {
  return {
    type: 'LOT_SIZE',
    minQty: randomPositiveFloat(8, minQtyRange),
    maxQty: randomPositiveFloat(8, maxQtyRange),
    stepSize: randomPrecisionStep(),
  } as LotSizeFilter;
}

export function mockMarketLotSizeFilter(
  minQtyRange: [number, number] = [1, 10],
  maxQtyRange: [number, number] = [11, 20],
): MarketLotSizeFilter {
  return {
    type: 'MARKET_LOT_SIZE',
    minQty: randomPositiveFloat(8, minQtyRange),
    maxQty: randomPositiveFloat(8, maxQtyRange),
    stepSize: randomPrecisionStep(),
  } as MarketLotSizeFilter;
}

export function mockMinNotionalFilter(): MinNotionalFilter {
  return {
    type: 'MIN_NOTIONAL',
    minNotional: randomPositiveFloat(8),
    applyToMarket: randomBoolean(),
    avgPriceMins: randomNonNegativeInt(),
  } as MinNotionalFilter;
}

export function mockNotionalFilter(): NotionalFilter {
  return {
    type: 'NOTIONAL',
    minNotional: randomPositiveFloat(8),
    applyMinToMarket: randomBoolean(),
    maxNotional: randomPositiveFloat(8),
    applyMaxToMarket: randomBoolean(),
    avgPriceMins: randomNonNegativeInt(),
  } as NotionalFilter;
}

export function mockPriceFilter(
  minPriceRange: [number, number] = [1, 10],
  maxPriceRange: [number, number] = [11, 20],
): PriceFilter {
  return {
    type: 'PRICE_FILTER',
    minPrice: randomPositiveFloat(8, minPriceRange),
    maxPrice: randomPositiveFloat(8, maxPriceRange),
    tickSize: randomPrecisionStep(),
  } as PriceFilter;
}
