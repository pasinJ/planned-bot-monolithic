import { faker } from '@faker-js/faker';
import { values } from 'ramda';
import { z } from 'zod';

import { exchangeNameEnum } from '#features/exchanges/domain/exchange.js';
import { LotSizeFilter } from '#features/symbols/domain/lotSizeFilter.entity.js';
import { MarketLotSizeFilter } from '#features/symbols/domain/marketLotSizeFilter.entity.js';
import { MinNotionalFilter } from '#features/symbols/domain/minNotionalFilter.entity.js';
import { NotionalFilter } from '#features/symbols/domain/notionalFilter.entity.js';
import { PriceFilter } from '#features/symbols/domain/priceFilter.entity.js';
import { Symbol, orderTypeEnum } from '#features/symbols/domain/symbol.entity.js';

import { anyBoolean, anyString, nonNegativeInt, randomPositiveFloat, randomPrecisionStep } from './faker.js';

export function mockSymbol(
  override?: Partial<{ [k in keyof Symbol]: Omit<Symbol[k], typeof z.BRAND> }>,
): Symbol {
  const minRange: [number, number] = [1, 10];
  const maxRange: [number, number] = [11, 20];

  return {
    id: anyString(),
    name: anyString(),
    exchange: faker.helpers.arrayElement(values(exchangeNameEnum)),
    baseAsset: anyString(),
    baseAssetPrecision: faker.number.int({ min: 0, max: 10 }),
    quoteAsset: anyString(),
    quoteAssetPrecision: faker.number.int({ min: 0, max: 10 }),
    orderTypes: faker.helpers.arrayElements(values(orderTypeEnum)),
    filters: [
      mockLotSizeFilter(minRange, maxRange),
      mockMarketLotSizeFilter(minRange, maxRange),
      mockMinNotionalFilter(),
      mockNotionalFilter(),
      mockPriceFilter(minRange, maxRange),
    ] as Symbol['filters'],
    version: override?.version ?? faker.number.int({ min: 0, max: 10 }),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  } as Symbol;
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
    applyToMarket: anyBoolean(),
    avgPriceMins: nonNegativeInt(),
  };
}

export function mockNotionalFilter(): NotionalFilter {
  return {
    type: 'NOTIONAL',
    minNotional: randomPositiveFloat(8),
    applyMinToMarket: anyBoolean(),
    maxNotional: randomPositiveFloat(8),
    applyMaxToMarket: anyBoolean(),
    avgPriceMins: nonNegativeInt(),
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
