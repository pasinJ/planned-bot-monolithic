import { faker } from '@faker-js/faker';

import { exchangeNameList } from '#features/shared/domain/exchangeName.js';
import { SymbolName } from '#features/shared/domain/symbolName.js';
import {
  LotSizeFilter,
  MarketLotSizeFilter,
  MinNotionalFilter,
  NotionalFilter,
  PriceFilter,
  SymbolModel,
  orderTypeList,
} from '#features/symbols/data-models/symbol.js';
import { RemoveBrand } from '#test-utils/types.js';

import {
  randomBoolean,
  randomNonNegativeInt,
  randomPositiveFloat,
  randomPrecisionStep,
  randomString,
} from '../../faker.js';

export function mockSymbol(override?: Partial<RemoveBrand<SymbolModel>>): SymbolModel {
  const minRange: [number, number] = [1, 10];
  const maxRange: [number, number] = [11, 20];

  return {
    name: randomString(),
    exchange: faker.helpers.arrayElement(exchangeNameList),
    baseAsset: randomString(),
    baseAssetPrecision: faker.number.int({ min: 0, max: 10 }),
    quoteAsset: randomString(),
    quoteAssetPrecision: faker.number.int({ min: 0, max: 10 }),
    orderTypes: faker.helpers.arrayElements(orderTypeList),
    filters: [
      mockLotSizeFilter(minRange, maxRange),
      mockMarketLotSizeFilter(minRange, maxRange),
      mockMinNotionalFilter(),
      mockNotionalFilter(),
      mockPriceFilter(minRange, maxRange),
    ] as SymbolModel['filters'],
    ...override,
  } as SymbolModel;
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
  };
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
  };
}

export function mockMinNotionalFilter(): MinNotionalFilter {
  return {
    type: 'MIN_NOTIONAL',
    minNotional: randomPositiveFloat(8),
    applyToMarket: randomBoolean(),
    avgPriceMins: randomNonNegativeInt(),
  };
}

export function mockNotionalFilter(): NotionalFilter {
  return {
    type: 'NOTIONAL',
    minNotional: randomPositiveFloat(8),
    applyMinToMarket: randomBoolean(),
    maxNotional: randomPositiveFloat(8),
    applyMaxToMarket: randomBoolean(),
    avgPriceMins: randomNonNegativeInt(),
  };
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
  };
}

export function randomSymbolName() {
  return faker.string.alpha({ length: 6, casing: 'upper' }) as SymbolName;
}
