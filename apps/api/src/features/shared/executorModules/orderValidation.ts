import { Decimal } from 'decimal.js';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { anyPass, includes, isNotNil, propEq } from 'ramda';
import { match } from 'ts-pattern';

import { Price } from '#features/btStrategies/dataModels/kline.js';
import {
  LotSizeFilter,
  MarketLotSizeFilter,
  MinNotionalFilter,
  NotionalFilter,
  PriceFilter,
  SymbolModel,
} from '#features/symbols/dataModels/symbol.js';

import { PendingOrder } from './orders.js';

export function isOrderTypeAllowed(
  orderType: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT',
  symbol: SymbolModel,
): e.Either<string, void> {
  return match(orderType)
    .with('MARKET', () =>
      includes('MARKET', symbol.orderTypes) ? e.right(undefined) : e.left('MARKET order type is not allowed'),
    )
    .with('LIMIT', () =>
      includes('LIMIT', symbol.orderTypes) ? e.right(undefined) : e.left('LIMIT order type is not allowed'),
    )
    .with('STOP_MARKET', () =>
      anyPass([includes('STOP_LOSS'), includes('TAKE_PROFIT')])(symbol.orderTypes)
        ? e.right(undefined)
        : e.left('STOP_MARKET order type is not allowed'),
    )
    .with('STOP_LIMIT', () =>
      anyPass([includes('STOP_LOSS_LIMIT'), includes('TAKE_PROFIT_LIMIT')])(symbol.orderTypes)
        ? e.right(undefined)
        : e.left('STOP_LIMIT order type is not allowed'),
    )
    .exhaustive();
}

export function validateQuantity(
  order: Extract<PendingOrder, { type: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
  symbol: SymbolModel,
): e.Either<string, void> {
  function validateWithFilter(filter: MarketLotSizeFilter | LotSizeFilter | undefined) {
    const minQuantity = filter?.minQty;
    const maxQuantity = filter?.maxQty;
    const stepSize = filter?.stepSize;

    return order.quantity <= 0
      ? e.left('Quantity must be greater than 0')
      : minQuantity && order.quantity < minQuantity
      ? e.left(`Quantity must be greater than or equal to min quantity (${minQuantity})`)
      : maxQuantity && order.quantity > maxQuantity
      ? e.left(`Quantity must be less than or equal to max quantity (${maxQuantity})`)
      : stepSize && new Decimal(order.quantity).modulo(stepSize).toNumber() !== 0
      ? e.left(`Quantity must be multiple of step size (${stepSize})`)
      : e.right(undefined);
  }

  const marketLotSizefilter = symbol.filters.find(propEq('MARKET_LOT_SIZE', 'type')) as
    | MarketLotSizeFilter
    | undefined;
  const lotSizefilter = symbol.filters.find(propEq('LOT_SIZE', 'type')) as LotSizeFilter | undefined;

  return order.type === 'MARKET'
    ? pipe(
        e.sequenceArray([validateWithFilter(marketLotSizefilter), validateWithFilter(lotSizefilter)]),
        e.asUnit,
      )
    : validateWithFilter(lotSizefilter);
}

export function validateLimitPrice(
  order: Extract<PendingOrder, { type: 'LIMIT' | 'STOP_LIMIT' }>,
  symbol: SymbolModel,
): e.Either<string, void> {
  const filter = symbol.filters.find(propEq('PRICE_FILTER', 'type')) as PriceFilter | undefined;
  const minPrice = filter?.minPrice;
  const maxPrice = filter?.maxPrice;
  const tickSize = filter?.tickSize;

  return order.limitPrice <= 0
    ? e.left('Limit price must be greater than 0')
    : minPrice && order.limitPrice < minPrice
    ? e.left(`Limit price must be greater than or equal to min price (${minPrice})`)
    : maxPrice && order.limitPrice > maxPrice
    ? e.left(`Limit price must be less than or equal to max price (${maxPrice})`)
    : tickSize && new Decimal(order.limitPrice).modulo(tickSize).toNumber() !== 0
    ? e.left(`Limit price must be multiple of tick size (${tickSize})`)
    : e.right(undefined);
}

export function validateStopPrice(
  order: Extract<PendingOrder, { type: 'STOP_MARKET' | 'STOP_LIMIT' }>,
  symbol: SymbolModel,
): e.Either<string, void> {
  const filter = symbol.filters.find(propEq('PRICE_FILTER', 'type')) as PriceFilter | undefined;
  const minPrice = filter?.minPrice;
  const maxPrice = filter?.maxPrice;
  const tickSize = filter?.tickSize;

  return order.stopPrice <= 0
    ? e.left('Stop price must be greater than 0')
    : minPrice && order.stopPrice < minPrice
    ? e.left(`Stop price must be greater than or equal to min price (${minPrice})`)
    : maxPrice && order.stopPrice > maxPrice
    ? e.left(`Stop price must be less than or equal to max price (${maxPrice})`)
    : tickSize && new Decimal(order.stopPrice).modulo(tickSize).toNumber() !== 0
    ? e.left(`Stop price must be multiple of tick size (${tickSize})`)
    : e.right(undefined);
}

export function validateNotional(
  order: Extract<PendingOrder, { type: 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
  symbol: SymbolModel,
): e.Either<string, void> {
  const notionalFilter = symbol.filters.find(propEq('NOTIONAL', 'type')) as NotionalFilter | undefined;
  const minNotionalFilter = symbol.filters.find(propEq('MIN_NOTIONAL', 'type')) as
    | MinNotionalFilter
    | undefined;

  const minNotional = isNotNil(notionalFilter)
    ? notionalFilter.minNotional
    : isNotNil(minNotionalFilter)
    ? minNotionalFilter.minNotional
    : undefined;
  const maxNotional = isNotNil(notionalFilter) ? notionalFilter.maxNotional : undefined;

  const validateWithMinNotional = (price: number) => {
    return isNotNil(minNotional) && new Decimal(price).times(order.quantity).toNumber() < minNotional;
  };
  const validateWithMaxNotional = (price: number) => {
    return isNotNil(maxNotional) && new Decimal(price).times(order.quantity).toNumber() > maxNotional;
  };

  const limitPrice = 'limitPrice' in order ? order.limitPrice : undefined;
  const stopPrice = 'stopPrice' in order ? order.stopPrice : undefined;

  return isNotNil(limitPrice) && validateWithMinNotional(limitPrice)
    ? e.left(`Limit price * quantity must greater than or equal to min notional (${minNotional})`)
    : isNotNil(limitPrice) && validateWithMaxNotional(limitPrice)
    ? e.left(`Limit price * quantity must less than or equal to max notional (${maxNotional})`)
    : isNotNil(stopPrice) && validateWithMinNotional(stopPrice)
    ? e.left(`Stop price * quantity must greater than or equal to min notional (${minNotional})`)
    : isNotNil(stopPrice) && validateWithMaxNotional(stopPrice)
    ? e.left(`Stop price * quantity must less than or equal to max notional (${maxNotional})`)
    : e.right(undefined);
}

export function validateMarketNotional(
  order: Extract<PendingOrder, { type: 'MARKET' | 'LIMIT' }>,
  symbol: SymbolModel,
  currentPrice: Price,
): e.Either<string, void> {
  const notionalFilter = symbol.filters.find(propEq('NOTIONAL', 'type')) as NotionalFilter | undefined;
  const minNotionalFilter = symbol.filters.find(propEq('MIN_NOTIONAL', 'type')) as
    | MinNotionalFilter
    | undefined;

  const shouldApplyMinNotionalFilter =
    isNotNil(minNotionalFilter) && minNotionalFilter.applyToMarket && minNotionalFilter.avgPriceMins === 0;
  const shouldApplyNotionalFilter = isNotNil(notionalFilter) && notionalFilter.avgPriceMins === 0;

  const minNotional =
    shouldApplyNotionalFilter && notionalFilter.applyMinToMarket
      ? notionalFilter.minNotional
      : shouldApplyMinNotionalFilter
      ? minNotionalFilter.minNotional
      : undefined;
  const maxNotional =
    shouldApplyNotionalFilter && notionalFilter.applyMaxToMarket ? notionalFilter.maxNotional : undefined;

  const validateWithMinNotional = (price: number) => {
    return isNotNil(minNotional) && new Decimal(price).times(order.quantity).toNumber() < minNotional;
  };
  const validateWithMaxNotional = (price: number) => {
    return isNotNil(maxNotional) && new Decimal(price).times(order.quantity).toNumber() > maxNotional;
  };

  return validateWithMinNotional(currentPrice)
    ? e.left(`Price * quantity must greater than or equal to min notional (${minNotional})`)
    : validateWithMaxNotional(currentPrice)
    ? e.left(`Price * quantity must less than or equal to max notional (${maxNotional})`)
    : e.right(undefined);
}
