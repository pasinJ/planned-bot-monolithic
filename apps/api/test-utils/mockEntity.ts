import { faker } from '@faker-js/faker';
import { values } from 'ramda';

import { exchangeEnum, orderTypeEnum } from '#features/symbols/domain/symbol.entity.js';

import { anyBoolean, anyString, nonNegativeInt, randomPositiveFloat, randomPrecisionStep } from './faker.js';

export function mockSymbol() {
  const minRange: [number, number] = [1, 10];
  const maxRange: [number, number] = [10, 20];

  return {
    id: anyString,
    name: anyString,
    exchange: faker.helpers.arrayElement(values(exchangeEnum)),
    baseAsset: anyString,
    baseAssetPrecision: faker.number.int({ min: 0, max: 10 }),
    quoteAsset: anyString,
    quoteAssetPrecision: faker.number.int({ min: 0, max: 10 }),
    orderTypes: faker.helpers.arrayElements(values(orderTypeEnum)),
    filters: [
      mockLotSizeFilter(minRange, maxRange),
      mockMarketLotSizeFilter(minRange, maxRange),
      mockMinNotionalFilter(),
      mockNotionalFilter(),
      mockPriceFilter(minRange, maxRange),
    ],
    version: faker.number.int({ min: 0, max: 10 }),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
}

export function mockLotSizeFilter(
  minQtyRange: [number, number] = [1, 10],
  maxQtyRange: [number, number] = [10, 20],
) {
  return {
    type: 'LOT_SIZE',
    minQty: randomPositiveFloat(8, minQtyRange),
    maxQty: randomPositiveFloat(8, maxQtyRange),
    stepSize: randomPrecisionStep(),
  };
}

export function mockMarketLotSizeFilter(
  minQtyRange: [number, number] = [1, 10],
  maxQtyRange: [number, number] = [10, 20],
) {
  return {
    type: 'MARKET_LOT_SIZE',
    minQty: randomPositiveFloat(8, minQtyRange),
    maxQty: randomPositiveFloat(8, maxQtyRange),
    stepSize: randomPrecisionStep(),
  };
}

export function mockMinNotionalFilter() {
  return {
    type: 'MIN_NOTIONAL',
    minNotional: randomPositiveFloat(8),
    applyToMarket: anyBoolean,
    avgPriceMins: nonNegativeInt,
  };
}

export function mockNotionalFilter() {
  return {
    type: 'NOTIONAL',
    minNotional: randomPositiveFloat(8),
    applyMinToMarket: anyBoolean,
    maxNotional: randomPositiveFloat(8),
    applyMaxToMarket: anyBoolean,
    avgPriceMins: nonNegativeInt,
  };
}

export function mockPriceFilter(
  minPriceRange: [number, number] = [1, 10],
  maxPriceRange: [number, number] = [10, 20],
) {
  return {
    type: 'PRICE_FILTER',
    minPrice: randomPositiveFloat(8, minPriceRange),
    maxPrice: randomPositiveFloat(8, maxPriceRange),
    tickSize: randomPrecisionStep(),
  };
}
