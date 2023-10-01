import { faker } from '@faker-js/faker';
import { DeepPartial } from 'ts-essentials';

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
import { Unbrand } from '#shared/utils/types.js';
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

export function mockSymbol(override?: DeepPartial<Unbrand<SymbolModel>>): SymbolModel {
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
      mockLotSizeFilter({ minQtyRange: minRange, maxQtyRange: maxRange }),
      mockMarketLotSizeFilter({ minQtyRange: minRange, maxQtyRange: maxRange }),
      mockMinNotionalFilter(),
      mockNotionalFilter(),
      mockPriceFilter({ minPriceRange: minRange, maxPriceRange: maxRange }),
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

export function mockMarketLotSizeFilter(
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

export function mockMinNotionalFilter(override?: Partial<MinNotionalFilter>): MinNotionalFilter {
  return {
    type: 'MIN_NOTIONAL',
    minNotional: randomPositiveFloat(8),
    applyToMarket: randomBoolean(),
    avgPriceMins: randomNonNegativeInt(),
    ...override,
  } as MinNotionalFilter;
}

export function mockNotionalFilter(override?: Partial<NotionalFilter>): NotionalFilter {
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

export function mockPriceFilter(
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
